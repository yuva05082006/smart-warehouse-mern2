# Smart Warehouse Management System — MERN Edition

A fresh rebuild of the Smart Warehouse Management System on the MERN stack
(MongoDB, Express, React, Node.js), using the original Java/Spring Boot +
MySQL project **only as a functional and UI reference** — no Java code,
packages, or architecture were carried over.

- **Frontend:** React 18 + Vite, React Router, Axios
- **Backend:** Node.js + Express, REST APIs
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs

---

## ⚠️ Please read before you run or submit this

This project was built in a sandboxed environment **with no internet
access**, so `npm install` could not be run and the app could not actually
be started end-to-end here (no live MongoDB, no installed `express`/`react`
packages, etc.). I could not literally "run and verify" it as requested.

What I *could* do, and did do, instead of just writing files and hoping:

- **Every backend file** (`backend/src/**/*.js`, 34 files) was checked with
  `node --check` — Node's real parser, not a guess. All pass.
- **Every route's controller imports** were cross-checked against each
  controller's actual exports (code, not visual inspection) — all resolve.
- **Every model import** across controllers/services/middleware was
  verified against the actual files in `models/` — all resolve.
- **Every frontend file** (`frontend/src/**/*.jsx` and `.js`, 47 files) was
  compiled with **esbuild** (the real engine Vite uses under the hood) — all
  pass, including JSX syntax. This caught one real bug (`useConfirm.js`
  contained JSX but had a `.js` extension, which Vite would have refused to
  parse) — it's fixed, now `useConfirm.jsx`.
- **The entire frontend was bundled from its entry point** (`esbuild
  main.jsx --bundle`, walking the real import graph) and it resolved
  successfully — every single `import` between all 47 files points at a
  file that actually exists, with no typos.

That is strong evidence the code is structurally sound, but it is **not**
the same as running it against a live MongoDB instance and clicking through
every workflow, which is what was actually asked for. Please run it
yourself following the steps below — budget time to fix anything small that
surfaces, the same way you would with any generated code before a review.

---

## 1. Project Structure

```
smart-warehouse-mern/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── seed/seed.js                  Demo data (equivalent of the old DataSeeder)
│   └── src/
│       ├── server.js                 Entry point: connects DB, starts listening
│       ├── app.js                    Express app: middleware + route mounting
│       ├── config/db.js              Mongoose connection
│       ├── models/                   10 Mongoose schemas
│       ├── controllers/              15 controllers (business logic)
│       ├── routes/                   15 route files (map URLs -> controllers)
│       ├── middleware/               auth.js (JWT + role check), errorHandler.js
│       ├── services/                 stockStatus, binRecommendation, capacity, activityLogger
│       └── utils/                    ApiError, asyncHandler, generateToken
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx, App.jsx
│       ├── index.css                 Shared stylesheet (navy/white theme, same as reference)
│       ├── context/                  AuthContext, ToastContext
│       ├── hooks/                    useAuth, useToast, useConfirm
│       ├── layouts/AppLayout.jsx     Sidebar + topbar shell
│       ├── components/               Sidebar, Topbar, Modal, ConfirmDialog, StatusBadge, states...
│       ├── services/                 15 API modules (one per resource), api.js (axios + interceptors)
│       └── pages/                    13 pages, one per module
├── .gitignore
└── README.md
```

---

## 2. Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| MongoDB | local server or Atlas | `mongod --version` (if local) |

---

## 3. MongoDB Setup

**Option A — Local MongoDB**
1. Install MongoDB Community Server for your OS from the official MongoDB
   site and start it (on Windows it usually installs as a service called
   "MongoDB"; on Mac/Linux, `mongod` or `brew services start mongodb-community`).
2. No manual database creation needed — MongoDB creates the database
   (`smart_warehouse_db`) automatically the first time the app writes to it.

**Option B — MongoDB Atlas (free cloud tier)**
1. Create a free cluster at mongodb.com/atlas.
2. Add your IP to the access list and create a database user.
3. Copy the connection string (`mongodb+srv://...`) — you'll paste it into
   `backend/.env` in the next step.

---

## 4. Configure and Run the Backend

```bash
cd smart-warehouse-mern/backend
cp .env.example .env
```

Open `.env` and set:
```env
MONGO_URI=mongodb://127.0.0.1:27017/smart_warehouse_db
JWT_SECRET=replace_this_with_a_long_random_string
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
SEED_ON_START=true
```
(For Atlas, replace `MONGO_URI` with your `mongodb+srv://...` string.)

```bash
npm install
npm run dev
```

You should see:
```
[DB] MongoDB connected -> 127.0.0.1/smart_warehouse_db
[Seed] Empty database detected -> inserting demo data...
[Seed] Demo data inserted successfully.
[Seed] Demo login -> manager / manager123   and   staff / staff123
[Server] Smart Warehouse API listening on http://localhost:5000
```

`SEED_ON_START=true` only inserts demo data the **first** time (it checks
if the `users` collection is empty). Set it to `false` any time after that,
or just leave it — it's a no-op on an already-seeded database. You can also
run the seed manually: `npm run seed`.

### Troubleshooting
| Symptom | Fix |
|---|---|
| `MONGO_URI is not set` | You forgot to `cp .env.example .env` and fill it in. |
| `ECONNREFUSED 127.0.0.1:27017` | Local MongoDB isn't running — start the `mongod` service. |
| `MongoServerError: bad auth` | Wrong username/password in an Atlas connection string. |
| `Port 5000 already in use` | Change `PORT` in `.env`. |

---

## 5. Configure and Run the Frontend

```bash
cd smart-warehouse-mern/frontend
cp .env.example .env   # only needed if your backend isn't on localhost:5000
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Demo Login
| Role | Username | Password |
|---|---|---|
| Manager | `manager` | `manager123` |
| Staff | `staff` | `staff123` |

Manager can create/edit/delete products, warehouses, racks and bins. Staff
can do everything else (receiving, orders, picking, dispatch, viewing) —
delete buttons for structural data are hidden in the UI **and** blocked on
the backend (`requireRole("MANAGER")` middleware), so it's enforced twice,
same as the reference project.

---

## 6. What Changed Going from Java/MySQL to MERN (design notes)

These are deliberate, documented adaptations — not oversights:

- **Inventory is embedded in Product**, not a separate collection. The old
  MySQL schema needed a separate `Inventory` table for a clean 1-to-1 join;
  in MongoDB, embedding `availableQuantity`/`reservedQuantity` directly on
  `Product` is the idiomatic equivalent and avoids an unnecessary lookup on
  every read. The business meaning (available vs. reserved) is identical.
- **Order items are embedded sub-documents** (`order.items[]`) rather than
  a separate `OrderItem` collection — Mongo's natural pattern for a
  parent that always loads with its children. Each sub-document gets its
  own `_id`, which `PickingTask.orderItemId` points back to (the MERN
  equivalent of the old `OrderItem` foreign key).
- **Dispatch gained `carrier`, `trackingNumber`, and `dispatchedBy` fields.**
  These weren't in the reference project but were explicitly requested in
  the rebuild brief's Dispatch checklist; they're purely additive, optional
  fields that don't change any workflow or business rule.
- **`Order.priority`, a `totalAmount`, and `shippingInfo`**, and a Product
  **`unitPrice`**, mentioned in the brief's generic field checklists, were
  **deliberately left out** — the reference project genuinely has none of
  these (no price field exists anywhere in it), and inventing pricing logic
  with no grounding in the reference risked contradicting "reproduce the
  same application" more than it helped. Easy to add later if you want them
  — say the word.
- **No multi-document transactions in `createOrder`.** A standalone (non-
  replica-set) MongoDB instance — the common local dev setup — doesn't
  support them. Order creation instead validates every line item's stock
  *before* writing anything, then applies all reservations, which avoids a
  partially-reserved order in the common case. For a production deployment
  on a MongoDB replica set, wrap the "apply" step in a
  `mongoose.startSession()` transaction — noted in a comment in
  `order.controller.js` at the exact spot.
- **JWTs are stateless** (no server-side session store), same documented
  trade-off as the reference project's custom token system: simple to
  explain, not meant to be production-grade auth.

---

## 7. API Endpoint Documentation

Base URL: `http://localhost:5000/api`. Every endpoint except `/auth/login`
requires header `Authorization: Bearer <token>`. 🔒 = additionally requires
the MANAGER role.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | `{username, password}` → `{token, username, fullName, role}` |
| POST | `/auth/logout` | Logs the action (JWTs are stateless, nothing to invalidate server-side) |
| GET | `/auth/me` | Current session info |

### Products
| GET | `/products?keyword=&category=&status=&sortBy=` | Search/filter/sort |
| GET | `/products/:id` | Get one |
| POST | `/products` | Create |
| PUT | `/products/:id` | Update |
| DELETE 🔒 | `/products/:id` | Delete (blocked if stock > 0) |

### Inventory
| GET | `/inventory` | Every product's live stock view |

### Warehouses / Racks / Bins
| GET/POST 🔒/PUT 🔒/DELETE 🔒 | `/warehouses`, `/warehouses/:id` | CRUD |
| GET | `/warehouses/:id/capacity` | `{capacity, occupied, available}` |
| GET/POST 🔒/PUT 🔒/DELETE 🔒 | `/racks?warehouseId=`, `/racks/:id` | CRUD |
| GET | `/racks/:id/capacity` | Capacity |
| GET/POST 🔒/PUT 🔒/DELETE 🔒 | `/bins?rackId=&warehouseId=`, `/bins/:id` | CRUD |
| GET | `/bins/:id/capacity` | Capacity |

### Smart Bin Recommendation
| GET | `/bin-recommendation?category=&quantity=&warehouseId=` | Recommended bin + reason |

### Stock Receiving
| GET | `/receipts` | Receiving history |
| POST | `/receipts` | `{productId, supplier, quantity, binId?, notes}` |

### Orders
| GET | `/orders?status=` | List (optionally filtered) |
| GET | `/orders/:id` | One order with items |
| POST | `/orders` | Create + reserve stock: `{customerName, customerContact, items:[{productId, quantity}]}` |
| PUT | `/orders/:id/status` | `{status}` |

### Picking
| POST | `/picking/start/:orderId` | Create picking tasks for an order |
| GET | `/picking/tasks?orderId=` | Tasks for an order |
| PUT | `/picking/tasks/:id/pick` | `{quantity}` |

### Dispatch
| GET | `/dispatch` | History |
| POST | `/dispatch` | `{orderId, carrier?, trackingNumber?, notes?}` |

### Tracking, Alerts, Activity Log, Dashboard
| GET | `/tracking/:idOrSku` | Look up by Mongo ID or SKU, with history |
| GET | `/alerts` | Live stock alerts |
| GET | `/activity-logs?module=&username=` | Filtered audit trail |
| GET | `/dashboard/summary` | All dashboard numbers in one call |

---

## 8. Business Rules (preserved from the reference project)

1. **Receiving** increases `availableQuantity`, validates the target bin
   has free capacity first, and auto-assigns the product's location on its
   first-ever receipt.
2. **Creating an order** reserves stock: validates every line item has
   enough `availableQuantity`, then moves the ordered amount from
   `availableQuantity` to `reservedQuantity` for every item.
3. **Picking** is where inventory is *actually* deducted — a recorded pick
   removes the picked amount from `reservedQuantity` entirely (it has
   physically left the warehouse). This is the only place deduction
   happens.
4. **Dispatch** never touches inventory quantities — stock was already
   deducted in step 3 — so an order can never be double-deducted. A unique
   index on `Dispatch.order` also guarantees one dispatch per order at the
   database level.
5. **Cancelling an order** releases whatever is still reserved (i.e., not
   yet picked) back to `availableQuantity`.
6. **Stock status** (`IN_STOCK` / `LOW_STOCK` / `OUT_OF_STOCK` /
   `OVERSTOCK`) is computed live on every read from
   `availableQuantity` vs `reorderLevel` — never stored, so it can't drift
   out of sync.
7. **Bin recommendation** is explicitly rule-based: must fit the requested
   quantity, prefers a bin already storing the same category, otherwise
   prefers the tightest ("best-fit") bin — with a plain-English reason
   returned every time.

---

## 9. Testing

No automated test suite is included in this rebuild (the brief didn't ask
for one, and the reference project's Jest/Mocha equivalent wasn't part of
scope here) — manual verification is the testing strategy. Suggested pass,
mirroring the full workflow the brief asked for:

```
1. Login as manager -> see Dashboard numbers all at 0/seeded values
2. Products -> add a product, edit it, confirm SKU-duplicate rejection
3. Receiving -> receive stock into a bin -> confirm Inventory page updates
4. Orders -> create an order -> confirm stock moved to "reserved"
5. Orders -> Start Picking -> Picking page -> record a pick -> confirm
   inventory "reserved" decreases and order moves toward PICKED
6. Orders -> mark PICKED order READY_FOR_DISPATCH
7. Dispatch -> dispatch the order -> confirm it doesn't double-deduct stock
8. Alerts -> confirm the deliberately low/out-of-stock seed products show up
9. Activity Log -> confirm every action above was recorded
10. Logout -> confirm redirect to /login and protected routes are blocked
```

### Manual API testing (curl)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","password":"manager123"}'

curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

---

## 10. Known Limitations

- No camera-based QR scanning — ID/SKU lookup is the working substitute
  (same limitation as the reference project, and explicitly allowed by the
  rebuild brief).
- JWT auth is stateless with no server-side revocation list — logging out
  just discards the token client-side, appropriate for a local/college
  deployment, not a production security posture.
- `createOrder`'s stock reservation is validate-then-apply rather than a
  true ACID transaction (see section 6) — fine for a standalone MongoDB
  instance, upgrade to a session transaction if you move to a replica set.
- Not run end-to-end in this environment — see the warning at the top.
  Please `npm install` and run both servers yourself with time to spare
  before a demo or submission.
