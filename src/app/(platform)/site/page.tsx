import { SiteSettingsForm } from "./site-settings-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function SiteSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Site Settings</CardTitle>
          <CardDescription>
            Configure withdrawal limits and bonus amounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SiteSettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}
