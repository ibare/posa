import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../components/ui/alert';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';

export function NotificationsScene() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Alert>
        <AlertTitle>Deploy succeeded</AlertTitle>
        <AlertDescription>
          Your production deploy finished in 42s. View the run for details.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>
          The card ending in 4242 was declined. Update billing to retry.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Inbox</CardTitle>
          <Badge>3 new</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">AM</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ana Marín</span>
                <span className="text-xs text-muted-foreground">2m</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Left a comment on the Q2 roadmap.
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">JY</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Jae-Young</span>
                <span className="text-xs text-muted-foreground">18m</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Invited you to review a pull request.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm">
              Mark all read
            </Button>
            <Button size="sm">Open inbox</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
