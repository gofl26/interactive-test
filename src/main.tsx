import React from "react";
import ReactDOM from "react-dom/client";

import CreateScene from "./components/babylonjs/CreateScene";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <main>
      <CreateScene />
    </main>
  </React.StrictMode>
);
