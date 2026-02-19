use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Task {
    id: String,
    text: String,
    quadrant: Option<u8>,
    completed: bool,
    #[serde(rename = "createdAt")]
    created_at: String,
}

#[tauri::command]
fn load_tasks(app: tauri::AppHandle) -> Vec<Task> {
    let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
    let tasks_path = app_data_dir.join("tasks.json");

    if !tasks_path.exists() {
        return Vec::new();
    }

    match fs::read_to_string(&tasks_path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

#[tauri::command]
fn save_tasks(app: tauri::AppHandle, tasks: Vec<Task>) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");

    fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;

    let tasks_path = app_data_dir.join("tasks.json");
    let json = serde_json::to_string_pretty(&tasks).map_err(|e| e.to_string())?;
    fs::write(&tasks_path, json).map_err(|e| e.to_string())?;

    Ok(())
}

// Updater types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "event", content = "data")]
pub enum DownloadEvent {
    #[serde(rename = "started")]
    Started { content_length: Option<u64> },
    #[serde(rename = "progress")]
    Progress { chunk_length: usize },
    #[serde(rename = "finished")]
    Finished,
}

pub struct PendingUpdate(pub Mutex<Option<tauri_plugin_updater::Update>>);

#[tauri::command]
async fn check_for_updates(
    app: tauri::AppHandle,
    pending: tauri::State<'_, PendingUpdate>,
) -> Result<UpdateInfo, String> {
    let updater = app
        .updater_builder()
        .build()
        .map_err(|e: tauri_plugin_updater::Error| e.to_string())?;

    match updater
        .check()
        .await
        .map_err(|e: tauri_plugin_updater::Error| e.to_string())?
    {
        Some(update) => {
            let version = update.version.clone();
            let notes = update.body.clone();
            *pending.0.lock().unwrap() = Some(update);
            Ok(UpdateInfo {
                available: true,
                version: Some(version),
                notes,
            })
        }
        None => Ok(UpdateInfo {
            available: false,
            version: None,
            notes: None,
        }),
    }
}

#[tauri::command]
async fn install_update(
    app: tauri::AppHandle,
    pending: tauri::State<'_, PendingUpdate>,
    on_event: tauri::ipc::Channel<DownloadEvent>,
) -> Result<(), String> {
    let update = pending
        .0
        .lock()
        .unwrap()
        .take()
        .ok_or("No pending update")?;

    let mut started = false;

    update
        .download_and_install(
            |chunk_length, content_length| {
                if !started {
                    let _ = on_event.send(DownloadEvent::Started { content_length });
                    started = true;
                }
                let _ = on_event.send(DownloadEvent::Progress { chunk_length });
            },
            || {
                let _ = on_event.send(DownloadEvent::Finished);
            },
        )
        .await
        .map_err(|e: tauri_plugin_updater::Error| e.to_string())?;

    app.restart();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(PendingUpdate(Mutex::new(None)))
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Ok(updater) = handle.updater_builder().build() {
                    if let Ok(Some(update)) = updater.check().await {
                        let version = update.version.clone();
                        let notes = update.body.clone();
                        let pending = handle.state::<PendingUpdate>();
                        *pending.0.lock().unwrap() = Some(update);
                        let _ = handle.emit(
                            "update-available",
                            UpdateInfo {
                                available: true,
                                version: Some(version),
                                notes,
                            },
                        );
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_tasks,
            save_tasks,
            check_for_updates,
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
