"use client";

import { sendCampaignAction, deleteCampaign } from "./actions";

export function CampaignActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {status === "draft" && (
        <button
          onClick={() => {
            if (window.confirm("Send this campaign to all customers with an email address?")) {
              sendCampaignAction(id);
            }
          }}
          className="rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-white transition duration-150 hover:bg-pine-light"
        >
          Send now
        </button>
      )}
      {status === "draft" && (
        <button
          onClick={() => {
            if (window.confirm("Delete this campaign?")) {
              deleteCampaign(id);
            }
          }}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition duration-150 hover:bg-red-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}
