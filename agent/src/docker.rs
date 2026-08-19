use std::collections::HashMap;

use bollard::models::{
    ContainerCreateBody, EndpointSettings, HostConfig, Mount, MountTypeEnum, NetworkingConfig,
    RestartPolicy, RestartPolicyNameEnum, VolumeCreateOptions,
};
use bollard::query_parameters::{
    CreateContainerOptionsBuilder, InspectContainerOptions, ListContainersOptionsBuilder,
    RemoveContainerOptionsBuilder, StartContainerOptions, StopContainerOptionsBuilder,
    UploadToContainerOptionsBuilder,
};
use bytes::Bytes;

pub fn connect() -> bollard::Docker {
    bollard::Docker::connect_with_local_defaults().expect("connect to docker socket")
}

pub fn container_name(server_id: uuid::Uuid) -> String {
    format!("mc-{server_id}")
}

pub fn labels(server_id: uuid::Uuid, subdomain: &str, base_domain: &str) -> HashMap<String, String> {
    HashMap::from([
        ("hostingmc".to_string(), "managed".to_string()),
        ("hostingmc.server_id".to_string(), server_id.to_string()),
        ("hostingmc.subdomain".to_string(), subdomain.to_string()),
        (
            "mc-router.host".to_string(),
            format!("{subdomain}.{base_domain}"),
        ),
    ])
}

pub async fn ensure_network(docker: &bollard::Docker, name: &str) {
    let filters = HashMap::from([("name".to_string(), vec![format!("^{name}$")])]);
    let existing = docker
        .list_networks(Some(
            bollard::query_parameters::ListNetworksOptionsBuilder::default()
                .filters(&filters)
                .build(),
        ))
        .await
        .unwrap_or_default();
    if existing.iter().any(|n| n.name.as_deref() == Some(name)) {
        return;
    }
    docker
        .create_network(bollard::models::NetworkCreateRequest {
            name: name.to_string(),
            driver: Some("bridge".to_string()),
            ..Default::default()
        })
        .await
        .expect("create mc network");
    tracing::info!(%name, "created docker network");
}

/// Pulls the image if it is not present locally.
pub async fn ensure_image(docker: &bollard::Docker, image: &str) -> Result<(), bollard::errors::Error> {
    if docker.inspect_image(image).await.is_ok() {
        return Ok(());
    }

    // Split "registry/repo:tag" at the last ':' that comes after the last '/'.
    let (repo, tag) = match image.rfind(':') {
        Some(i) if i > image.rfind('/').unwrap_or(0) => (&image[..i], &image[i + 1..]),
        _ => (image, "latest"),
    };

    tracing::info!(%image, "pulling image");
    use bollard::query_parameters::CreateImageOptionsBuilder;
    let mut stream = docker.create_image(
        Some(
            CreateImageOptionsBuilder::default()
                .from_image(repo)
                .tag(tag)
                .build(),
        ),
        None,
        None,
    );

    use futures_util::StreamExt;
    while let Some(item) = stream.next().await {
        match item {
            Ok(info) => {
                if let Some(err) = info.error {
                    return Err(bollard::errors::Error::DockerResponseServerError {
                        status_code: 500,
                        message: err,
                    });
                }
            }
            Err(e) => return Err(e),
        }
    }
    tracing::info!(%image, "image ready");
    Ok(())
}

pub async fn ensure_volume(docker: &bollard::Docker, name: &str) {
    let _ = docker
        .create_volume(VolumeCreateOptions {
            name: Some(name.to_string()),
            labels: Some(labels_for_volume()),
            ..Default::default()
        })
        .await;
}

fn labels_for_volume() -> HashMap<String, String> {
    HashMap::from([("hostingmc".to_string(), "managed".to_string())])
}

pub struct CreateSpec {
    pub server_id: uuid::Uuid,
    pub subdomain: String,
    pub image: String,
    pub volume_name: String,
    pub mem_mb: i64,
    pub cpu_millicores: i64,
    pub network: String,
    pub base_domain: String,
    pub pumpkin_toml: String,
    pub whitelist_json: String,
}

/// Creates and starts a game container. Returns the container id.
pub async fn create_and_start(
    docker: &bollard::Docker,
    spec: &CreateSpec,
) -> Result<String, bollard::errors::Error> {
    ensure_image(docker, &spec.image).await?;
    ensure_volume(docker, &spec.volume_name).await;

    let name = container_name(spec.server_id);
    let mut endpoints = HashMap::new();
    endpoints.insert(spec.network.clone(), EndpointSettings::default());

    let body = ContainerCreateBody {
        image: Some(spec.image.clone()),
        labels: Some(labels(spec.server_id, &spec.subdomain, &spec.base_domain)),
        host_config: Some(HostConfig {
            memory: Some(spec.mem_mb * 1024 * 1024),
            nano_cpus: Some(spec.cpu_millicores * 1_000_000),
            mounts: Some(vec![Mount {
                target: Some("/pumpkin".to_string()),
                source: Some(spec.volume_name.clone()),
                typ: Some(MountTypeEnum::VOLUME),
                ..Default::default()
            }]),
            restart_policy: Some(RestartPolicy {
                name: Some(RestartPolicyNameEnum::NO),
                ..Default::default()
            }),
            ..Default::default()
        }),
        networking_config: Some(NetworkingConfig {
            endpoints_config: Some(endpoints),
            ..Default::default()
        }),
        ..Default::default()
    };

    let created = docker
        .create_container(
            Some(CreateContainerOptionsBuilder::default().name(&name).build()),
            body,
        )
        .await?;
    let id = created.id;

    upload_configs(docker, &id, &spec.pumpkin_toml, &spec.whitelist_json).await?;

    docker
        .start_container(&id, None::<StartContainerOptions>)
        .await?;

    Ok(id)
}

/// Packs pumpkin.toml and whitelist.json into a tar and uploads to /pumpkin.
pub async fn upload_configs(
    docker: &bollard::Docker,
    container_id: &str,
    pumpkin_toml: &str,
    whitelist_json: &str,
) -> Result<(), bollard::errors::Error> {
    let mut tar_builder = tar::Builder::new(Vec::new());

    // data/ must exist for whitelist.json; add the dir entry explicitly.
    let mut dir_header = tar::Header::new_gnu();
    dir_header.set_entry_type(tar::EntryType::Directory);
    dir_header.set_mode(0o755);
    dir_header.set_size(0);
    dir_header.set_cksum();
    tar_builder
        .append_data(&mut dir_header, "data", std::io::empty())
        .expect("tar append dir");

    for (path, content) in [
        ("pumpkin.toml", pumpkin_toml),
        ("data/whitelist.json", whitelist_json),
    ] {
        let mut header = tar::Header::new_gnu();
        header.set_size(content.len() as u64);
        header.set_mode(0o644);
        header.set_cksum();
        tar_builder
            .append_data(&mut header, path, content.as_bytes())
            .expect("tar append");
    }

    let tar_bytes = tar_builder.into_inner().expect("tar finish");
    docker
        .upload_to_container(
            container_id,
            Some(
                UploadToContainerOptionsBuilder::default()
                    .path("/pumpkin")
                    .build(),
            ),
            bollard::body_full(Bytes::from(tar_bytes)),
        )
        .await
}

pub async fn start(docker: &bollard::Docker, server_id: uuid::Uuid) -> Result<(), bollard::errors::Error> {
    docker
        .start_container(&container_name(server_id), None::<StartContainerOptions>)
        .await
}

pub async fn stop(docker: &bollard::Docker, server_id: uuid::Uuid) -> Result<(), bollard::errors::Error> {
    docker
        .stop_container(
            &container_name(server_id),
            Some(StopContainerOptionsBuilder::default().t(15).build()),
        )
        .await
}

pub async fn remove(docker: &bollard::Docker, server_id: uuid::Uuid) -> Result<(), bollard::errors::Error> {
    docker
        .remove_container(
            &container_name(server_id),
            Some(RemoveContainerOptionsBuilder::default().force(true).build()),
        )
        .await
}

pub async fn remove_volume(docker: &bollard::Docker, name: &str) -> Result<(), bollard::errors::Error> {
    docker
        .remove_volume(
            name,
            Some(bollard::query_parameters::RemoveVolumeOptionsBuilder::default().force(true).build()),
        )
        .await
}

/// Downloads /pumpkin from the container as a tar and re-packs it as a zip.
/// Works on stopped containers. v1: buffers in memory (worlds are small on our plans).
pub async fn download_world_zip(
    docker: &bollard::Docker,
    server_id: uuid::Uuid,
) -> Result<Vec<u8>, bollard::errors::Error> {
    use bollard::query_parameters::DownloadFromContainerOptionsBuilder;
    use futures_util::StreamExt;

    let mut stream = docker.download_from_container(
        &container_name(server_id),
        Some(DownloadFromContainerOptionsBuilder::default().path("/pumpkin").build()),
    );

    let mut tar_bytes = Vec::new();
    while let Some(chunk) = stream.next().await {
        tar_bytes.extend_from_slice(&chunk?);
    }

    let tar_bytes = std::sync::Arc::new(tar_bytes);
    let tar_clone = tar_bytes.clone();
    tokio::task::spawn_blocking(move || tar_to_zip(&tar_clone))
        .await
        .expect("zip task")
        .map_err(|msg| bollard::errors::Error::DockerResponseServerError {
            status_code: 500,
            message: msg,
        })
}

fn tar_to_zip(tar_bytes: &[u8]) -> Result<Vec<u8>, String> {
    use std::io::{Read, Write};

    let mut archive = tar::Archive::new(tar_bytes);
    let mut zip_writer = zip::ZipWriter::new(std::io::Cursor::new(Vec::new()));
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    let entries = archive.entries().map_err(|e| e.to_string())?;
    for entry in entries {
        let mut entry = entry.map_err(|e| e.to_string())?;
        if !entry.header().entry_type().is_file() {
            continue;
        }
        let path = entry.path().map_err(|e| e.to_string())?.to_path_buf();
        let path_str = path.to_string_lossy().to_string();
        // tar from docker prefixes with the folder name: "pumpkin/..."
        let rel = path_str
            .strip_prefix("pumpkin/")
            .unwrap_or(&path_str)
            .to_string();
        if rel.is_empty() {
            continue;
        }
        let mut content = Vec::new();
        entry.read_to_end(&mut content).map_err(|e| e.to_string())?;
        zip_writer.start_file(rel, options).map_err(|e| e.to_string())?;
        zip_writer.write_all(&content).map_err(|e| e.to_string())?;
    }

    let cursor = zip_writer.finish().map_err(|e| e.to_string())?;
    Ok(cursor.into_inner())
}

pub async fn is_running(docker: &bollard::Docker, server_id: uuid::Uuid) -> Option<bool> {    let info = docker
        .inspect_container(&container_name(server_id), None::<InspectContainerOptions>)
        .await
        .ok()?;
    Some(info.state?.running?)
}

pub struct ManagedContainer {
    pub server_id: uuid::Uuid,
    pub subdomain: String,
}

/// All containers labeled hostingmc=managed on this docker host.
pub async fn list_managed(docker: &bollard::Docker) -> Vec<ManagedContainer> {
    let filters = HashMap::from([("label".to_string(), vec!["hostingmc=managed".to_string()])]);
    let list = docker
        .list_containers(Some(
            ListContainersOptionsBuilder::default()
                .all(true)
                .filters(&filters)
                .build(),
        ))
        .await
        .unwrap_or_default();

    list.into_iter()
        .filter_map(|c| {
            let labels = c.labels?;
            let id = labels.get("hostingmc.server_id")?.parse().ok()?;
            let subdomain = labels.get("hostingmc.subdomain")?.clone();
            Some(ManagedContainer {
                server_id: id,
                subdomain,
            })
        })
        .collect()
}
