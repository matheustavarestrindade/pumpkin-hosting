use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::time::{Duration, timeout};

pub struct ServerPing {
    pub players_online: i64,
    pub players_max: i64,
}

fn write_varint(buf: &mut Vec<u8>, mut value: i64) {
    loop {
        let mut byte = (value & 0x7f) as u8;
        value >>= 7;
        if value != 0 {
            byte |= 0x80;
        }
        buf.push(byte);
        if value == 0 {
            break;
        }
    }
}

fn write_string(buf: &mut Vec<u8>, s: &str) {
    write_varint(buf, s.len() as i64);
    buf.extend_from_slice(s.as_bytes());
}

fn packet(id: i64, payload: &[u8]) -> Vec<u8> {
    let mut body = Vec::new();
    write_varint(&mut body, id);
    body.extend_from_slice(payload);
    let mut out = Vec::new();
    write_varint(&mut out, body.len() as i64);
    out.extend_from_slice(&body);
    out
}

async fn read_varint(stream: &mut TcpStream) -> Result<i64, String> {
    let mut result: i64 = 0;
    for i in 0..5 {
        let byte = stream
            .read_u8()
            .await
            .map_err(|e| format!("read varint: {e}"))?;
        result |= ((byte & 0x7f) as i64) << (7 * i);
        if byte & 0x80 == 0 {
            return Ok(result);
        }
    }
    Err("varint too long".to_string())
}

/// Minecraft status ping (server list query). Talks directly to the container
/// over the internal network - no router involved.
pub async fn ping(host: &str, port: u16) -> Result<ServerPing, String> {
    let fut = async {
        let mut stream = TcpStream::connect((host, port))
            .await
            .map_err(|e| format!("connect: {e}"))?;

        // handshake (next state 1 = status)
        let mut hs = Vec::new();
        write_varint(&mut hs, 767); // protocol version we claim
        write_string(&mut hs, host);
        hs.extend_from_slice(&port.to_be_bytes());
        write_varint(&mut hs, 1);
        stream
            .write_all(&packet(0x00, &hs))
            .await
            .map_err(|e| e.to_string())?;
        stream
            .write_all(&packet(0x00, &[])) // status request
            .await
            .map_err(|e| e.to_string())?;

        // response: len, packet id, json string
        let _packet_len = read_varint(&mut stream).await?;
        let _packet_id = read_varint(&mut stream).await?;
        let json_len = read_varint(&mut stream).await? as usize;
        let mut json_buf = vec![0u8; json_len];
        stream
            .read_exact(&mut json_buf)
            .await
            .map_err(|e| e.to_string())?;

        let value: serde_json::Value =
            serde_json::from_slice(&json_buf).map_err(|e| e.to_string())?;
        let players = &value["players"];
        Ok(ServerPing {
            players_online: players["online"].as_i64().unwrap_or(0),
            players_max: players["max"].as_i64().unwrap_or(0),
        })
    };
    timeout(Duration::from_secs(3), fut)
        .await
        .map_err(|_| "ping timeout".to_string())?
}
