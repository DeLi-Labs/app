import { CampaignCard } from "~~/components/profile/CampaignCard";
import { PatentCard } from "~~/components/profile/PatentCard";
import { ProfileEmptyState } from "~~/components/profile/ProfileEmptyState";
import { ProfileScrollArea } from "~~/components/profile/ProfileScrollArea";
import { StartCampaignForm } from "~~/components/profile/register-campaign/StartCampaignForm";
import { RegisterIpForm } from "~~/components/profile/register-ip/RegisterIpForm";
import type { NormalizedCampaignItem, NormalizedIpItem, ProfileTab } from "~~/components/profile/types";

type ProfileContentProps = {
  activeTab: ProfileTab;
  ipItems: NormalizedIpItem[];
  campaigns: NormalizedCampaignItem[];
  registerIpOpen: boolean;
  startCampaignOpen: boolean;
  startCampaignPatentTokenId: number | null;
  onRegisterIp: () => void;
  onCloseRegisterIp: () => void;
  onRegisterIpSuccess: () => void;
  onCloseStartCampaign: () => void;
  onStartCampaignSuccess: () => void;
  onRequestStartLicensing: (patentTokenId: number | null) => void;
};

export const ProfileContent = ({
  activeTab,
  ipItems,
  campaigns,
  registerIpOpen,
  startCampaignOpen,
  startCampaignPatentTokenId,
  onRegisterIp,
  onCloseRegisterIp,
  onRegisterIpSuccess,
  onCloseStartCampaign,
  onStartCampaignSuccess,
  onRequestStartLicensing,
}: ProfileContentProps) => {
  if (registerIpOpen) {
    return (
      <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-transparent bg-deli-main px-[10px] py-5 md:px-[30px] [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]">
        <RegisterIpForm onCancel={onCloseRegisterIp} onSuccess={onRegisterIpSuccess} />
      </section>
    );
  }

  if (startCampaignOpen) {
    return (
      <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-transparent bg-deli-main px-[10px] py-5 md:px-[30px] [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]">
        <StartCampaignForm
          ipItems={ipItems}
          initialPatentTokenId={startCampaignPatentTokenId}
          onCancel={onCloseStartCampaign}
          onSuccess={onStartCampaignSuccess}
        />
      </section>
    );
  }

  const isIpTab = activeTab === "ips";
  const header = isIpTab ? "Your IP NFTs" : "Your Licensing Campaigns";
  const count = isIpTab ? ipItems.length : campaigns.length;
  const isEmpty = count === 0;

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-transparent bg-deli-main px-[10px] py-5 md:px-[30px] [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h4 className="m-0 text-h4 text-deli-white">{header}</h4>
        <p className="m-0 text-body-3 text-deli-grey-light">{`Total: ${count}`}</p>
      </div>

      {isEmpty ? (
        <ProfileEmptyState onRegisterIp={onRegisterIp} />
      ) : (
        <ProfileScrollArea maxHeightPx={760}>
          <div className="mx-auto grid w-full max-w-full grid-cols-1 justify-items-center justify-center gap-7 md:mx-0 md:grid-cols-[repeat(auto-fill,minmax(400px,400px))] md:justify-items-stretch md:justify-start">
            {isIpTab
              ? ipItems.map(item => (
                  <PatentCard
                    key={item.tokenId}
                    item={item}
                    onStartLicensing={() => onRequestStartLicensing(item.tokenId)}
                  />
                ))
              : campaigns.map(item => <CampaignCard key={`${item.tokenId}-${item.licenseAddress}`} item={item} />)}
          </div>
        </ProfileScrollArea>
      )}
    </section>
  );
};
