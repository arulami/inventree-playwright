# InvenTree Parts — Test environment & shared data

Shared pre-conditions for all InvenTree Parts manual cases (UI and API).

## 0. Test environment & shared data

**Environment:** InvenTree stable, web UI (React "Platform UI"), default global settings unless a case says otherwise.

**Users**

| User | Role |
|---|---|
| `admin` | Superuser / staff (can change global settings) |
| `engineer` | Part group: view, change, add, delete |
| `viewer` | Part group: view only |

**Category tree**

```
Electronics
├── Resistors
│   └── SMD Resistors
└── Capacitors
Mechanical
└── Fasteners
```

**Parameter templates:** `Resistance` (units `ohm`), `Tolerance` (units `%`), `Package` (choices `0402,0603,0805`), `RoHS` (checkbox), `Serial Ref` (unique: globally unique), `Colour` (no units).

**Seed parts**

| Part | Flags | Category |
|---|---|---|
| `R-10K-0603` (IPN `RES-0001`) | Component, Purchaseable | SMD Resistors |
| `Widget` | Template, Assembly, Trackable, Testable, Salable | Electronics |
| `Widget-Red`, `Widget-Blue` | variants of Widget | Electronics |
| `Controller Board` | Assembly, Component, Trackable | Electronics |
| `Firmware Licence` | Virtual, Salable | Electronics |
| `Solder Paste` | Consumable, Component | Mechanical |
| `Hookup Wire` | units `m`, Purchaseable | Electronics |
| `M3 Screw` | Component, Purchaseable | Fasteners |
