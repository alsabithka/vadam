const fs = require("fs")

// 1. Remove from Play.tsx
let playCode = fs.readFileSync("src/scenes/Play.tsx", "utf-8")
playCode = playCode.replace(
  /import bgMusic from "\.\.\/imports\/Aadeda_Aattam_Nee_Video_Song___Vadam_Vali_Song___Aadu_2___Shaan_Rahman___Jayasurya___Vijay_Babu\.mp3"\n/,
  "",
)
playCode = playCode.replace(
  /      \{active && \(\n        <audio src=\{bgMusic\} autoPlay loop \/>\n      \)\}\n/,
  "",
)
fs.writeFileSync("src/scenes/Play.tsx", playCode)

// 2. Add to App.tsx
let appCode = fs.readFileSync("src/App.tsx", "utf-8")
if (!appCode.includes("bgMusic")) {
  appCode = appCode.replace(
    /import type \{ VoiceController \} from "\.\/lib\/voice"/,
    `import type { VoiceController } from "./lib/voice"\nimport bgMusic from "./imports/Aadeda_Aattam_Nee_Video_Song___Vadam_Vali_Song___Aadu_2___Shaan_Rahman___Jayasurya___Vijay_Babu.mp3"`,
  )

  appCode = appCode.replace(
    /    <div className="h-full w-full">/,
    `    <div className="h-full w-full">\n      <audio src={bgMusic} autoPlay loop />`,
  )
  fs.writeFileSync("src/App.tsx", appCode)
}
