import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <span className="text-xl font-bold gradient-text">STABLE-FUNDS</span>
    </Link>
  );
} 