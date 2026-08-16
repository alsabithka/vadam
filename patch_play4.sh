cat << 'INNEREOF' > tmp_play4.patch
@@ -37,14 +37,18 @@
   onWin,
   onExit,
 }: PlayProps) {
-  const [count, setCount] = useState(3)
-  const active = count === 0
-  const { state, anim, peerLeft } = useTugGame({
-    role,
-    transport,
-    voice,
-    active,
-  })
+  const [count, setCount] = useState(() => Math.max(0, Math.ceil((startAt - Date.now()) / 1000)))
 
   useEffect(() => {
-    if (count === 0) return
-    const t = setTimeout(() => setCount((c) => c - 1), 750)
-    return () => clearTimeout(t)
-  }, [count])
+    if (count <= 0) return
+    let raf = 0
+    const tick = () => {
+      const left = Math.ceil((startAt - Date.now()) / 1000)
+      if (left <= 0) setCount(0)
+      else {
+        setCount(left)
+        raf = requestAnimationFrame(tick)
+      }
+    }
+    raf = requestAnimationFrame(tick)
+    return () => cancelAnimationFrame(raf)
+  }, [startAt, count])
+
+  // We initialize useTugGame below but we need active and peerLeft computed.
+  // Since hooks can't be conditional, we can't easily compute active based on peerLeft before calling useTugGame if we use peerLeft from useTugGame.
+  // But we can just use active as `count === 0` initially to let it mount. Let's fix that.
INNEREOF
patch src/scenes/Play.tsx tmp_play4.patch
