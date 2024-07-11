use bson::Bson;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

mod legacy_0_0_0;

pub const SEARCHMGR_VERSION: &str = "0.1.0";

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
    #[serde(default = "String::new")]
    book_name: String,
    #[serde(default = "String::new")]
    book_author: String,
    #[serde(default = "String::new")]
    url: String,
    #[serde(default = "Vec::new")]
    keywords: Vec<String>,
    #[serde(default = "Vec::new")]
    text_files: Vec<TextFile>,
    #[serde(default = "Vec::new")]
    binary_files: Vec<BinaryFile>,
    #[serde(default = "String::new")]
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
    let bson_res = bson::from_slice::<Bson>(&binary).map_err(|_| "file error".to_string())?;
    let ver = &bson_res
        .as_document()
        .ok_or("project file format error".to_string())?
        .get("searchmgr_version")
        .ok_or("project file format error".to_string())?
        .as_str()
        .ok_or("project file format error".to_string())?;
    if ver == &SEARCHMGR_VERSION {
        let res = bson::from_bson::<DataWithId>(bson_res).map_err(|_| "file error".to_string())?;
        Ok(res)
    } else {
        match *ver {
            "0.0.0" => {
                let data_0_0_0 = bson::from_bson::<legacy_0_0_0::DataWithId>(bson_res)
                    .map_err(|_| "file error".to_string())?;
                Ok(legacy_0_0_0::update(data_0_0_0))
            }
            _ => Err(format!("unsupported version: {ver}")),
        }
    }
}

pub fn write_bson(data_with_id: DataWithId) -> Result<Vec<u8>, String> {
    let buf = bson::to_vec(&data_with_id).map_err(|_| "error at generate bson data".to_string())?;
    Ok(buf)
}
