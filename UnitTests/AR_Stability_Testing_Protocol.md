# AR Stability & Real-Device Validation Protocol

This protocol is designed to stress-test the ARKit/RealityKit layer on a physical device before we lock in spatial persistence.

## 1. Surface Detection Accuracy (Horizontal & Vertical)

| Test Case | Description | Pass Criteria |
| :--- | :--- | :--- |
| **Texture Variance** | Scan a clear glass table vs. a wooden rug. | App shows "Need more detail" on glass and detects the rug within 3 seconds. |
| **Wall Detection** | Scan a plain white wall vs. a wall with a poster. | `ARCoachingOverlay` guides user to move until wall is found. |
| **Scale Accuracy** | Place a product with known dimensions (e.g., 60cm wide). | Use a real tape measure to verify AR model size matches real-world scale +/- 2cm. |

## 2. Tracking Stability (Stress Tests)

| Stress Test | Action | Pass Criteria |
| :--- | :--- | :--- |
| **Occlusion** | Walk between the camera and the placed AR object. | The object stays fixed; it shouldn't "jump" to the person's body. |
| **Extreme Lighting** | Turn off lights until the room is dim. | `AppLogger` should record `insufficientFeatures`. The object should stay roughly in place. |
| **Vibration/Shake** | Quickly jerk the phone while looking at an object. | Object should not drift significantly from its origin point. |

## 3. Session Interruption Validation

**Test Flow:**
1. Place a 3D model in your room.
2. Press the **Power Button** to lock the phone.
3. Wait 10 seconds.
4. Unlock the phone and return to the app.
5. **Expected Result**: The app should show "Relocalizing..." and the object should pop back into its exact original position once tracking is restored.

## 4. Debugging Visualization (Dev Only)

I have enabled **Debug Options** in your development builds. On your device, you will now see:
*   **Yellow Dots**: Feature points Being tracked by ARKit.
*   **Axe (XYZ)**: The world origin and anchor origins.

**If you see feature points disappearing, it means the environment is too plain or too dark for stable AR.**

## 5. Next Steps
Once we confirm that objects remain stable during these tests, we will implement **ARAnchor Persistence**, which will save these world coordinates to the local database so you can close the app entirely and return to the same AR scene later.
