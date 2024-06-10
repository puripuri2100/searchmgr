import { listen } from "@tauri-apps/api/event";
import { dialog } from "@tauri-apps/api";
import { save, open } from "@tauri-apps/api/dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";

const useListen = () => {
  async function f() {
    await listen<string>("import", async () => {
      const path = await open();
      if (path) {
        const dataText = await readTextFile(String(path));
        const data: any = JSON.parse(dataText);
      }
    })
  }

  f();
}

export default useListen;
