import { LogoMark } from "@/components/shared/logo";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Frame shared by every authentication page. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="gap-6 py-8">
      <CardHeader className="justify-items-center gap-3 px-6 text-center sm:px-8">
        <LogoMark className="size-10" />
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-6 sm:px-8">{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-center border-t px-6 pt-6 text-sm text-muted-foreground sm:px-8">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
