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

fn update_text_file_type(t: TextFileType) -> super::TextFileType {
    use TextFileType::*;
    match t {
        Text => super::TextFileType::Text,
        Rust => super::TextFileType::Rust,
        Tex => super::TextFileType::Tex,
        Json => super::TextFileType::Json,
        Toml => super::TextFileType::Toml,
        Yaml => super::TextFileType::Yaml,
        C => super::TextFileType::C,
        Cpp => super::TextFileType::Cpp,
        Ocaml => super::TextFileType::Ocaml,
        Satysfi => super::TextFileType::Satysfi,
        AnyTextFile => super::TextFileType::AnyTextFile,
    }
}

fn update_text_file(t: TextFile) -> super::TextFile {
    super::TextFile {
        file_name: t.file_name,
        file_type: update_text_file_type(t.file_type),
        contents: t.contents,
    }
}

fn update_binary_file_type(t: BinaryFileType) -> super::BinaryFileType {
    use BinaryFileType::*;
    match t {
        Jpeg => super::BinaryFileType::Jpeg,
        Png => super::BinaryFileType::Png,
        Pdf => super::BinaryFileType::Pdf,
    }
}

fn update_binary_file(t: BinaryFile) -> super::BinaryFile {
    super::BinaryFile {
        file_name: t.file_name,
        file_type: update_binary_file_type(t.file_type),
        contents: t.contents,
    }
}

pub fn update(data_with_id: DataWithId) -> super::DataWithId {
    let mut v = Vec::new();
    for data in data_with_id.data {
        v.push(super::Data {
            title: data.title,
            book_name: data.book_name,
            book_author: String::new(),
            url: data.url,
            keywords: data.keywords,
            text_files: data
                .text_files
                .iter()
                .map(|t| update_text_file(t.clone()))
                .collect(),
            binary_files: data
                .binary_files
                .iter()
                .map(|t| update_binary_file(t.clone()))
                .collect(),
            memo: data.memo,
            created_at: data.created_at,
            last_edit: data.last_edit,
        })
    }
    super::DataWithId {
        id: data_with_id.id,
        searchmgr_version: super::SEARCHMGR_VERSION.to_string(),
        data: v,
    }
}
