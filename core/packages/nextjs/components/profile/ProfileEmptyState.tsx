import { ARROW_NEXT, FOLDER_ICON, PROFILE_GLOW } from "~~/components/assets/common";

type ProfileEmptyStateProps = {
  onRegisterIp: () => void;
};

export const ProfileEmptyState = ({ onRegisterIp }: ProfileEmptyStateProps) => {
  return (
    <div className="relative flex h-full min-h-[500px] items-center justify-center overflow-hidden rounded-[inherit]">
      <div className="relative z-10 flex flex-col items-center">
        <span>{FOLDER_ICON}</span>
        <div className="h-5" />
        <h6 className="m-0 text-h6 text-deli-white">No Intellectual Property registered yet</h6>
        <div className="h-1" />
        <p className="m-0 text-body-2 text-deli-white">Register your first IP to get started</p>
        <div className="h-7" />
        <button
          type="button"
          onClick={onRegisterIp}
          className="flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 text-body-2 text-deli-white"
        >
          <span>Register IP</span>
          <span>{ARROW_NEXT}</span>
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0 z-[1] rounded-[inherit] opacity-80">
        {PROFILE_GLOW}
      </div>
    </div>
  );
};
