use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TextFileType {
    Text,
    Rust,
    Tex,
    Json,
    Toml,
    Yaml,
    C,
    Cpp,
    Ocaml,
    Satysfi,
    AnyTextFile,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct TextFile {
    file_type: TextFileType,
    file_name: String,
    contents: String,
}

#[derive(Clone, Debug, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BinaryFileType {
    Png,
    Jpeg,
    Pdf,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BinaryFile {
    file_type: BinaryFileType,
    file_name: String,
    contents: Vec<u8>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Data {
    title: String,
    book_name: String,
    url: String,
    keywords: Vec<String>,
    text_files: Vec<TextFile>,
    binary_files: Vec<BinaryFile>,
    memo: String,
    created_at: DateTime<Utc>,
    last_edit: DateTime<Utc>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct DataWithId {
    id: Uuid,
    searchmgr_version: String,
    data: Vec<Data>,
}

pub async fn parse_bson(binary: Vec<u8>) -> Result<DataWithId, String> {
    bson::from_slice(&binary).map_err(|_| "file error".to_string())
}

pub fn write_bson(data_with_id: DataWithId) -> Result<Vec<u8>, String> {
    let mut v = Vec::new();
    for data in data_with_id.data.iter() {
        v.push(Data {
            title: data.title.clone(),
            book_name: data.book_name.clone(),
            url: data.url.clone(),
            keywords: data.keywords.clone(),
            text_files: data.text_files.clone(),
            binary_files: data.binary_files.clone(),
            memo: data.memo.clone(),
            created_at: data.created_at,
            last_edit: data.last_edit,
        })
    }
    let parse_data = DataWithId {
        id: data_with_id.id,
        searchmgr_version: data_with_id.searchmgr_version,
        data: v,
    };
    let buf = bson::to_vec(&parse_data).map_err(|_| "error at generate bson data".to_string())?;
    Ok(buf)
}
