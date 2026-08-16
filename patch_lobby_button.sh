cat << 'INNEREOF' > tmp_lobby_button.patch
@@ -148,13 +148,22 @@
           <p className="font-body text-sm text-marigold">{connError}</p>
         )}

-        <button
-          onClick={() => onStart(voiceRef.current)}
-          disabled={!ready}
-          className="w-full rounded-xl bg-marigold px-6 py-4 font-display text-2xl font-extrabold text-cream shadow-[0_4px_0_#b45a10] transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
-        >
-          Start Tug!
-        </button>
+        {role === "host" || mode === "local" ? (
+          <button
+            onClick={handleStart}
+            disabled={!ready}
+            className="w-full rounded-xl bg-marigold px-6 py-4 font-display text-2xl font-extrabold text-cream shadow-[0_4px_0_#b45a10] transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
+          >
+            Start Tug!
+          </button>
+        ) : (
+          <div 
+            className={`w-full rounded-xl px-6 py-4 font-display text-2xl font-extrabold text-cream transition ${ready ? "bg-marigold shadow-[0_4px_0_#b45a10] animate-pulse" : "bg-black/20 border border-cream/15 text-cream/40"}`}
+          >
+            {ready ? "Waiting for host..." : "Complete setup to join"}
+          </div>
+        )}
+
         <p className="font-body text-xs text-cream/70">
           Best played in landscape · turn up the volume
         </p>
INNEREOF
patch src/scenes/Lobby.tsx tmp_lobby_button.patch
