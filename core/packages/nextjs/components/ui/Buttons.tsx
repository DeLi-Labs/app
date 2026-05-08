import Image from "next/image";
import Link from "next/link";

export interface ButtonProps {
  className?: string;
  onClick?: () => void;
  href?: string;
}

export const LaunchAppButton = ({ className = "", onClick, href = "/registration" }: ButtonProps) => {
  const content = (
    <button
      onClick={onClick}
      className={`btn bg-white text-black border-none hover:bg-white/90 px-8 py-3 h-auto rounded-[10px] text-btn shadow-none min-w-[180px] ${className}`}
    >
      Launch App
    </button>
  );

  if (href && !onClick) {
    return (
      <Link href={href} passHref legacyBehavior>
        {content}
      </Link>
    );
  }

  return content;
};

const viewOnGitHubButtonClassName = (className: string) =>
  `btn btn-outline border-deli-white text-deli-white hover:bg-deli-hover px-8 py-3 h-auto rounded-[10px] inline-flex items-center justify-center gap-2 text-btn shadow-none min-w-[180px] no-underline ${className}`;

export const ViewOnGitHubButton = ({ className = "", onClick, href = "https://github.com" }: ButtonProps) => {
  const label = (
    <>
      View on GitHub
      <Image src="/assets/github.svg" alt="GitHub" width={24} height={24} className="brightness-0 invert" />
    </>
  );

  if (href && !onClick) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" className={viewOnGitHubButtonClassName(className)}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={viewOnGitHubButtonClassName(className)}>
      {label}
    </button>
  );
};
