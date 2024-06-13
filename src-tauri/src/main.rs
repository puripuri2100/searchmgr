// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::*;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let new_project = CustomMenuItem::new("new_project".to_string(), "New Project");
    let import = CustomMenuItem::new("import".to_string(), "Import");
    let export_bibtex = CustomMenuItem::new("export_bibtex".to_string(), "Export Bibtex");
    let filemenu = Submenu::new("File", Menu::new().add_item(new_project).add_item(import).add_item(export_bibtex));

    let menu = Menu::new().add_submenu(filemenu);
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "new_project" => {
                let window = event.window();
                window.emit("new_project", "new_project".to_string()).unwrap();
            }
            "import" => {
                let window = event.window();
                window.emit("import", "import".to_string()).unwrap();
            }
            "export_bibtex" => {
                let window = event.window();
                window.emit("export_bibtex", "export_bibtex".to_string()).unwrap();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
