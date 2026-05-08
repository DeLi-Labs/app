import { ProfileSidebarContent, type ProfileSidebarContentProps } from "~~/components/profile/ProfileSidebarContent";

export const ProfileSidebar = (props: ProfileSidebarContentProps) => {
  return (
    <aside className="hidden w-[300px] min-w-[300px] flex-col self-stretch rounded-xl border border-transparent bg-deli-main px-[30px] py-5 lg:flex [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]">
      <ProfileSidebarContent {...props} />
    </aside>
  );
};
