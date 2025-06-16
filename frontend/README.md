# Dinheiros Frontend

A modern web application for personal finance management, built with React, TypeScript, and Tailwind CSS.

## Features

- User authentication (login/register)
- Account management
- Transaction tracking (income, expenses, transfers)
- Dashboard with financial overview
- Responsive design

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Backend API running (see backend README for setup)

## Getting Started

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Environment Variables**

   Create a `.env` file in the frontend directory:

   ```env
   VITE_API_URL=http://localhost:8080/api
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

4. **Build for production**

   ```bash
   npm run build
   ```

   The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── .eslintrc.cjs       # ESLint configuration
├── .gitignore          # Git ignore file
├── index.html          # HTML template
├── package.json        # Project dependencies
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json      # TypeScript configuration
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Technologies Used

- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [React Router](https://reactrouter.com/) - Client-side routing
- [Axios](https://axios-http.com/) - HTTP client
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Zod](https://zod.dev/) - Schema validation
- [Heroicons](https://heroicons.com/) - Icons
- [date-fns](https://date-fns.org/) - Date utility library

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
