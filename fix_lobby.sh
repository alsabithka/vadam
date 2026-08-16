cat << 'INNEREOF' > tmp_fix_lobby.patch
@@ -82,13 +82,14 @@
     await voiceRef.current?.calibrateNoiseFloor(1000)
     setCalib("quiet-done")
   }
+
+  const handleStart = () => {
+    if (role === "guest") return
+    const startAt = Date.now() + 1500
+    transport.sendMatchStart(startAt)
+    onStart(voiceRef.current, startAt)
+  }
+
   const measureShout = async () => {
-    const handleStart = () => {
-      if (role === "guest") return
-      const startAt = Date.now() + 1500
-      transport.sendMatchStart(startAt)
-      onStart(voiceRef.current, startAt)
-    }
     setCalib("shout")
     await voiceRef.current?.calibratePeak(1800)
     setCalib("done")
INNEREOF
patch src/scenes/Lobby.tsx tmp_fix_lobby.patch
