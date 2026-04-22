import { Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Progress } from '../../../components/ui/progress';
import { Skeleton } from '../../../components/ui/skeleton';
import { Switch } from '../../../components/ui/switch';

/**
 * 온보딩 카드에 렌더링할 컴포넌트 프리뷰.
 * 등록된 id만 실제 렌더, 나머지는 텍스트 fallback.
 */
export const COMPONENT_PREVIEWS: Record<string, () => React.ReactElement> = {
  button: () => (
    <div className="flex items-center gap-1.5">
      <Button size="sm">Button</Button>
      <Button size="sm" variant="secondary">
        Secondary
      </Button>
    </div>
  ),
  input: () => <Input placeholder="email@domain.com" className="max-w-[180px]" />,
  checkbox: () => (
    <div className="flex items-center gap-2 text-foreground text-xs">
      <Checkbox defaultChecked id="preview-cb" />
      <label htmlFor="preview-cb">Accept terms</label>
    </div>
  ),
  switch: () => (
    <div className="flex items-center gap-2 text-foreground text-xs">
      <Switch defaultChecked />
      <span>Enabled</span>
    </div>
  ),
  badge: () => (
    <div className="flex items-center gap-1.5">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
    </div>
  ),
  card: () => (
    <Card className="w-[180px]">
      <CardHeader className="p-3">
        <CardTitle className="text-sm">Card title</CardTitle>
        <CardDescription className="text-xs">One-line desc</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
        Body content
      </CardContent>
    </Card>
  ),
  avatar: () => (
    <div className="flex items-center gap-1.5">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-[10px] font-medium">MK</AvatarFallback>
      </Avatar>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-medium">
          JS
        </AvatarFallback>
      </Avatar>
    </div>
  ),
  progress: () => <Progress value={62} className="w-[180px]" />,
  skeleton: () => (
    <div className="flex flex-col gap-1.5 w-full">
      <Skeleton className="h-3 w-[140px]" />
      <Skeleton className="h-3 w-[100px]" />
      <Skeleton className="h-3 w-[160px]" />
    </div>
  ),
  alert: () => (
    <Alert className="w-[220px] py-2.5 px-3">
      <Bell />
      <AlertTitle className="text-xs">Heads up</AlertTitle>
      <AlertDescription className="text-[11px]">
        Something to note
      </AlertDescription>
    </Alert>
  ),
};

export function hasPreview(componentId: string): boolean {
  return componentId in COMPONENT_PREVIEWS;
}
