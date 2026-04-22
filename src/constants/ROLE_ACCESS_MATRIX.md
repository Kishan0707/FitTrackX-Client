## Role Access Matrix

### Roles
- `user`
- `coach`
- `admin`
- `seller`
- `affiliate`

### Current Route Intent
- `admin`: Full admin dashboard, moderation, reports, product verification.
- `coach`: Coaching workflows, plans, assigned clients/workouts.
- `user`: Consumer app flows (workouts, stats, subscriptions, buying products).
- `seller`: Commerce inventory/order management.
- `affiliate`: Affiliate self data and earnings visibility.

### Commerce Endpoints
- `POST /api/products`: `coach`, `seller`, `admin`
- `GET /api/products?mine=true`: seller/coach own products, otherwise verified catalog
- `GET /api/orders/seller`: `seller`, `admin`
- `PUT /api/orders/:id`: `seller`, `admin`
- `GET /api/seller/*`: `seller`, `admin`
- `GET /api/affiliate/me`: `affiliate`, `admin`

### Core Guards Added
- `GET /api/auth/users`: `admin`
- `POST /api/onboarding/complete`: `user`
- `POST /api/plan/create`: `coach`, `admin`
- `GET /api/plan/my-plan`: `coach`, `admin`
- `PUT /api/plan/update/:id`: `coach`, `admin`
- `DELETE /api/plan/delete/:id`: `coach`, `admin`
- `POST /api/subscriptions/assign`: `coach`, `admin`
- `POST /api/subscriptions/subscribe`: `user`, `admin`
- `PATCH /api/subscriptions/cancel/:id`: `user`, `admin`
- `POST /api/steps/assign`: `coach`
- `POST /api/steps/log`: `user`
- `POST /api/sessions`: `coach`, `admin`
- `PATCH /api/sessions/:id/respond`: `user`

Keep route guards and controller checks aligned with `src/constants/roles.js`.
