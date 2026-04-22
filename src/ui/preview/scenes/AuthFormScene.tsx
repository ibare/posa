import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

export function AuthFormScene() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your email below to sign into your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="preview-email">Email</Label>
          <Input id="preview-email" type="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preview-password">Password</Label>
          <Input id="preview-password" type="password" placeholder="••••••••" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="preview-remember" />
          <Label htmlFor="preview-remember" className="text-sm font-normal">
            Remember me for 30 days
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button className="w-full">Sign in</Button>
        <Button variant="outline" className="w-full">
          Continue with SSO
        </Button>
      </CardFooter>
    </Card>
  );
}
