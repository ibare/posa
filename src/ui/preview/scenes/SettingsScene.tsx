import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { Slider } from '../../../components/ui/slider';
import { Switch } from '../../../components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';

export function SettingsScene() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Configure how Posa looks and behaves.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="appearance">
          <TabsList>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="appearance" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Reduce motion</Label>
                <p className="text-xs text-muted-foreground">
                  Minimize non-essential animations.
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Compact layout</Label>
                <p className="text-xs text-muted-foreground">
                  Tighter spacing across tables and lists.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Base font size</Label>
                <span className="text-xs text-muted-foreground">14 px</span>
              </div>
              <Slider defaultValue={[14]} min={12} max={20} step={1} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm">
                Reset
              </Button>
              <Button size="sm">Save changes</Button>
            </div>
          </TabsContent>
          <TabsContent
            value="notifications"
            className="mt-4 text-sm text-muted-foreground"
          >
            Control how and when Posa notifies you.
          </TabsContent>
          <TabsContent
            value="billing"
            className="mt-4 text-sm text-muted-foreground"
          >
            Manage your subscription and invoices.
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
