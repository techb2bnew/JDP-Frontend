# JDP Admin Dashboard

A comprehensive ecommerce admin dashboard built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Authentication System**: Complete login, signup, OTP verification, and password reset
- **Dashboard Overview**: Key metrics and performance indicators
- **Staff Management**: Comprehensive staff, lead labour, and labour management
- **Job Management**: Create, track, and manage job postings
- **Contractor Listing**: Directory of available contractors with detailed profiles
- **Live Tracking**: Real-time job progress and resource tracking
- **Analytics**: Detailed reports and performance charts
- **Invoice Management**: Generate and manage billing documents
- **Product Management**: Manage product listings and inventory
- **Customer Management**: Customer database and interaction tracking
- **Dark/Light Mode**: Complete theme switching functionality
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Redux Toolkit
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/jdp-admin-dashboard.git
cd jdp-admin-dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard layout group
│   │   ├── analytics/     # Analytics page
│   │   ├── dashboard/     # Main dashboard
│   │   ├── staff/         # Staff management
│   │   └── ...           # Other dashboard pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── providers.tsx     # App providers
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── auth/             # Authentication components
│   └── ...              # Feature components
├── contexts/             # React contexts
├── redux/               # Redux store and slices
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Key Features

### Authentication
- Login with email/password
- Signup with email verification
- OTP verification system
- Password reset functionality
- QuickBooks integration onboarding

### Dashboard
- Real-time metrics and KPIs
- Interactive charts and graphs
- Recent activity feeds
- Quick action buttons

### Staff Management
- Complete staff directory
- Role-based access control
- Performance tracking
- Document management

### Job Management
- Job creation and posting
- Contractor matching
- Progress tracking
- Resource allocation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.