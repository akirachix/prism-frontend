import { ButtonLink } from "../ui/Button";
import { Alert, PageHeader } from "../ui/bits";

export default function ScreeningUnavailable({
  backHref,
  backLabel,
}: {
  backHref: string;
  backLabel: string;
}) {
  return (
    <main className="ui-page">
      <PageHeader
        title="Screening"
        back={{ href: backHref, label: backLabel }}
      />
      <div className="ui-body ui-body--narrow">
        <Alert>
          Screening is not available right now. Nothing was opened or saved.
          Please try again later.
        </Alert>
        <div className="ui-actions">
          <ButtonLink href={backHref} variant="outline">
            {backLabel}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
