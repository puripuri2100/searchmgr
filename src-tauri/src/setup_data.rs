use chrono::{DateTime, Utc};
use semver::Version;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{BufReader, Read, Write};
use std::path::Path;
use uuid::Uuid;

#[derive(Clone, Debug, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
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
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct TextFile {
    file_type: TextFileType,
    file_name: String,
    contents: String,
}

#[derive(Clone, Debug, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum BinaryFileType {
    Png,
    Jpeg,
    Pdf,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ParseBinaryFile {
    file_type: BinaryFileType,
    file_name: String,
    contents: Vec<u8>,
    #[serde(with = "bson::serde_helpers::uuid_1_as_binary")]
    file_id: Uuid,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ParseData {
    title: String,
    book_name: String,
    url: String,
    keywords: Vec<String>,
    text_files: Vec<TextFile>,
    binary_files: Vec<ParseBinaryFile>,
    memo: String,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    created_at: DateTime<Utc>,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    last_edit: DateTime<Utc>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ParseDataWithId {
    id: Uuid,
    searchmgr_version: Version,
    data: Vec<ParseData>,
}

pub async fn parse_bson(path: &str) -> Result<ParseDataWithId, String> {
    let reader = BufReader::new(File::open(path).unwrap());
    bson::from_reader(reader).map_err(|_| "file error".to_string())
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BinaryFile {
    file_type: BinaryFileType,
    file_name: String,
    /// 一時フォルダに置く時のファイル名
    file_path: String,
    file_id: Uuid,
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
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    created_at: DateTime<Utc>,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    last_edit: DateTime<Utc>,
}

pub fn write_binary_file(
    app_data_path: &str,
    project_id: &Uuid,
    file_path: &str,
) -> Result<BinaryFile, String> {
    let read_path = Path::new(file_path);
    let extension = read_path.extension().unwrap_or_default().to_str().unwrap();
    let file_type = match extension {
        "pdf" => BinaryFileType::Pdf,
        "jpeg" | "jpg" => BinaryFileType::Jpeg,
        "png" => BinaryFileType::Png,
        _ => return Err("unsupported file type".to_string()),
    };
    let file_name = read_path.file_name().unwrap().to_str().unwrap().to_string();
    let id = Uuid::new_v4();
    let write_path = Path::new(app_data_path)
        .join(project_id.to_string())
        .join(id.to_string());
    let mut binary = File::open(read_path).map_err(|_| "error at read file".to_string())?;
    let mut buf = Vec::new();
    binary
        .read_to_end(&mut buf)
        .map_err(|_| "error at read file".to_string())?;
    let mut binary = File::create(&write_path).unwrap();
    binary
        .write_all(&buf)
        .map_err(|_| "error at create file".to_string())?;
    Ok(BinaryFile {
        file_type,
        file_name,
        file_path: write_path.to_str().unwrap().to_string(),
        file_id: id,
    })
}

pub fn setup_binary_file(
    app_data_path: &str,
    project_id: &Uuid,
    files: &[ParseBinaryFile],
) -> Result<Vec<BinaryFile>, String> {
    let folder_path = Path::new(app_data_path).join(project_id.to_string());
    let folder = Path::new(&folder_path);
    if !(folder.exists() && folder.is_dir()) {
        fs::create_dir_all(folder).map_err(|_| "error at create file".to_string())?;
    }
    let mut v = Vec::new();
    for file in files.iter() {
        let file_path = folder.join(file.file_id.to_string());
        if !file_path.exists() {
            let mut file_buf =
                File::create(&file_path).map_err(|_| "error at create file".to_string())?;
            file_buf
                .write_all(&file.contents)
                .map_err(|_| "error at write file".to_string())?;
        }
        v.push(BinaryFile {
            file_name: file.file_name.clone(),
            file_type: file.file_type,
            file_id: file.file_id,
            file_path: file_path.to_str().unwrap().to_string(),
        })
    }
    Ok(v)
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct DataWithId {
    id: Uuid,
    searchmgr_version: Version,
    data: Vec<Data>,
}

pub async fn parse_data_to_data(
    app_data_path: &str,
    parse_data: ParseDataWithId,
) -> Result<DataWithId, String> {
    let mut v = Vec::new();
    for data in parse_data.data.iter() {
        v.push(Data {
            title: data.title.clone(),
            book_name: data.book_name.clone(),
            url: data.url.clone(),
            keywords: data.keywords.clone(),
            text_files: data.text_files.clone(),
            binary_files: setup_binary_file(app_data_path, &parse_data.id, &data.binary_files)?,
            memo: data.memo.clone(),
            created_at: data.created_at,
            last_edit: data.last_edit,
        })
    }
    Ok(DataWithId {
        id: parse_data.id,
        searchmgr_version: parse_data.searchmgr_version,
        data: v,
    })
}

fn read_binary_file(binary_files: &[BinaryFile]) -> Result<Vec<ParseBinaryFile>, String> {
    let mut v = Vec::new();
    for binary_file in binary_files.iter() {
        let file_path = Path::new(&binary_file.file_path);
        let mut buf = Vec::new();
        let mut file = File::open(file_path).map_err(|_| "error at read file")?;
        file.read_to_end(&mut buf)
            .map_err(|_| "error at read file")?;
        v.push(ParseBinaryFile {
            file_type: binary_file.file_type,
            file_name: binary_file.file_name.clone(),
            contents: buf,
            file_id: binary_file.file_id,
        })
    }
    Ok(v)
}

pub fn write_bson(file_path: &str, data_with_id: DataWithId) -> Result<(), String> {
    let mut v = Vec::new();
    for data in data_with_id.data.iter() {
        v.push(ParseData {
            title: data.title.clone(),
            book_name: data.book_name.clone(),
            url: data.url.clone(),
            keywords: data.keywords.clone(),
            text_files: data.text_files.clone(),
            binary_files: read_binary_file(&data.binary_files)?,
            memo: data.memo.clone(),
            created_at: data.created_at,
            last_edit: data.last_edit,
        })
    }
    let parse_data = ParseDataWithId {
        id: data_with_id.id,
        searchmgr_version: data_with_id.searchmgr_version,
        data: v,
    };
    let buf = bson::to_vec(&parse_data).map_err(|_| "error at generate bson data".to_string())?;
    let mut file = File::create(file_path).map_err(|_| "error at open file".to_string())?;
    file.write_all(&buf)
        .map_err(|_| "error at write file".to_string())?;
    Ok(())
}
