import {
  Bell,
  Bold,
  ChevronDown,
  ChevronRight,
  Circle,
  Folder,
  Heart,
  Home,
  Italic,
  Loader2,
  Search,
  Underline,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Progress } from '../../../components/ui/progress';
import {
  RadioGroup,
  RadioGroupItem,
} from '../../../components/ui/radio-group';
import {
  Select,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { Skeleton } from '../../../components/ui/skeleton';
import { Slider } from '../../../components/ui/slider';
import { Switch } from '../../../components/ui/switch';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import { Textarea } from '../../../components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';

/**
 * 온보딩 카드에 렌더링할 컴포넌트 프리뷰.
 * 44개 전체 커버. 복잡하거나 "열린 상태"가 있어야만 뜻이 통하는 컴포넌트는
 * 정적 JSX로 시각화하되 shadcn 토큰(bg-primary, text-muted-foreground 등)을
 * 그대로 써서 PreviewScope에서 주입한 색이 그대로 먹도록 한다.
 */
export const COMPONENT_PREVIEWS: Record<string, () => React.ReactElement> = {
  // typography
  typography: () => (
    <div className="flex flex-col gap-0.5 text-foreground">
      <span className="font-display text-lg leading-tight">Display</span>
      <span className="text-xs">The quick brown fox</span>
      <span className="text-[10px] text-muted-foreground font-mono">
        caption · 10pt
      </span>
    </div>
  ),

  // interactive
  button: () => (
    <div className="flex items-center gap-1.5">
      <Button size="sm">Button</Button>
      <Button size="sm" variant="secondary">
        Secondary
      </Button>
    </div>
  ),
  'icon-button': () => (
    <div className="flex items-center gap-1.5">
      <Button size="icon" variant="outline" className="h-8 w-8">
        <Heart />
      </Button>
      <Button size="icon" className="h-8 w-8">
        <Search />
      </Button>
    </div>
  ),
  link: () => (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="text-primary underline underline-offset-4 text-sm hover:no-underline"
    >
      Read documentation
    </a>
  ),
  checkbox: () => (
    <div className="flex items-center gap-2 text-foreground text-xs">
      <Checkbox defaultChecked id="preview-cb" />
      <Label htmlFor="preview-cb" className="text-xs">
        Accept terms
      </Label>
    </div>
  ),
  radio: () => (
    <RadioGroup defaultValue="a" className="gap-1.5">
      <div className="flex items-center gap-2 text-foreground text-xs">
        <RadioGroupItem value="a" id="r-a" />
        <Label htmlFor="r-a" className="text-xs">
          Option A
        </Label>
      </div>
      <div className="flex items-center gap-2 text-foreground text-xs">
        <RadioGroupItem value="b" id="r-b" />
        <Label htmlFor="r-b" className="text-xs">
          Option B
        </Label>
      </div>
    </RadioGroup>
  ),
  switch: () => (
    <div className="flex items-center gap-2 text-foreground text-xs">
      <Switch defaultChecked />
      <span>Enabled</span>
    </div>
  ),
  slider: () => <Slider defaultValue={[42]} className="w-[180px]" />,
  'toggle-group': () => (
    <ToggleGroup type="single" defaultValue="bold" variant="outline" size="sm">
      <ToggleGroupItem value="bold" className="h-7 w-7 min-w-7 px-0">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" className="h-7 w-7 min-w-7 px-0">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" className="h-7 w-7 min-w-7 px-0">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  ),

  // input
  input: () => <Input placeholder="email@domain.com" className="max-w-[180px]" />,
  textarea: () => (
    <Textarea
      placeholder="Write a message…"
      className="max-w-[200px] min-h-[56px] text-xs"
    />
  ),
  select: () => (
    <Select>
      <SelectTrigger className="w-[160px] h-8 text-xs">
        <SelectValue placeholder="Pick one" />
      </SelectTrigger>
    </Select>
  ),
  combobox: () => (
    <div className="flex items-center justify-between w-[180px] h-8 px-3 rounded-md border border-input bg-transparent text-xs text-muted-foreground">
      <span>Select framework…</span>
      <Search className="h-3 w-3 opacity-50" />
    </div>
  ),
  'date-picker': () => (
    <div className="flex items-center gap-2 w-[180px] h-8 px-3 rounded-md border border-input bg-transparent text-xs text-muted-foreground">
      <span>Pick a date</span>
      <span className="ml-auto tabular-nums">📅</span>
    </div>
  ),

  // container
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
  dialog: () => (
    <div className="w-[200px] rounded-lg border bg-card text-card-foreground shadow-lg p-3 space-y-1.5">
      <div className="text-sm font-medium">Confirm action</div>
      <div className="text-xs text-muted-foreground">
        This cannot be undone.
      </div>
      <div className="flex justify-end gap-1.5 pt-1">
        <Button size="sm" variant="outline" className="h-7 text-xs">
          Cancel
        </Button>
        <Button size="sm" className="h-7 text-xs">
          Confirm
        </Button>
      </div>
    </div>
  ),
  sheet: () => (
    <div className="flex h-[80px] w-[200px] rounded-md border bg-background overflow-hidden">
      <div className="flex-1 bg-muted" />
      <div className="w-[120px] bg-card p-2 space-y-1 border-l">
        <div className="text-[10px] font-medium text-foreground">Settings</div>
        <Separator />
        <div className="h-1 w-12 rounded bg-muted" />
        <div className="h-1 w-8 rounded bg-muted" />
      </div>
    </div>
  ),
  popover: () => (
    <div className="relative">
      <div className="w-[180px] rounded-md border bg-popover text-popover-foreground shadow-md p-3 space-y-1.5">
        <div className="text-xs font-medium">Dimensions</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Width</span>
          <div className="ml-auto h-1.5 w-16 rounded bg-primary/30" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Height</span>
          <div className="ml-auto h-1.5 w-10 rounded bg-primary/30" />
        </div>
      </div>
    </div>
  ),
  accordion: () => (
    <Accordion
      type="single"
      collapsible
      defaultValue="item-1"
      className="w-[200px] text-foreground"
    >
      <AccordionItem value="item-1" className="border-b">
        <AccordionTrigger className="py-1.5 text-xs">
          Is it accessible?
        </AccordionTrigger>
        <AccordionContent className="text-xs text-muted-foreground">
          Yes. ARIA-compliant.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" className="border-b-0">
        <AccordionTrigger className="py-1.5 text-xs">
          Is it styled?
        </AccordionTrigger>
      </AccordionItem>
    </Accordion>
  ),
  collapsible: () => (
    <Collapsible defaultOpen className="w-[180px] space-y-1">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-xs text-foreground">
        <span>@peduarte starred 3 repos</span>
        <ChevronDown className="h-3 w-3" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        <div className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground font-mono">
          @radix-ui/primitives
        </div>
        <div className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground font-mono">
          @radix-ui/colors
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
  separator: () => (
    <div className="w-[180px] space-y-2">
      <div className="text-xs text-foreground">Account</div>
      <Separator />
      <div className="flex h-4 items-center gap-2 text-[11px] text-muted-foreground">
        <span>Blog</span>
        <Separator orientation="vertical" />
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Source</span>
      </div>
    </div>
  ),

  // feedback
  toast: () => (
    <div className="flex w-[220px] items-start gap-2 rounded-md border bg-background text-foreground shadow-lg p-3">
      <div className="flex-1 space-y-0.5">
        <div className="text-xs font-medium">Scheduled: Catch up</div>
        <div className="text-[11px] text-muted-foreground">
          Friday, Feb 10 at 5:57 PM
        </div>
      </div>
      <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]">
        Undo
      </Button>
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
  badge: () => (
    <div className="flex items-center gap-1.5">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
    </div>
  ),
  tag: () => (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      <Badge variant="outline">design</Badge>
      <Badge variant="outline">system</Badge>
      <Badge variant="outline">tokens</Badge>
    </div>
  ),
  tooltip: () => (
    <div className="relative flex flex-col items-center">
      <div className="rounded-md bg-primary text-primary-foreground text-xs px-2 py-1 shadow">
        Tooltip
      </div>
      <div className="h-0 w-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-primary" />
      <div className="mt-0.5 text-[11px] text-muted-foreground">hover me</div>
    </div>
  ),
  progress: () => <Progress value={62} className="w-[180px]" />,
  spinner: () => (
    <Loader2 className="h-5 w-5 animate-spin text-primary" />
  ),
  skeleton: () => (
    <div className="flex flex-col gap-1.5 w-full">
      <Skeleton className="h-3 w-[140px]" />
      <Skeleton className="h-3 w-[100px]" />
      <Skeleton className="h-3 w-[160px]" />
    </div>
  ),

  // navigation
  'nav-menu': () => (
    <div className="flex items-center gap-1 rounded-md border bg-background p-1">
      <Button size="sm" variant="ghost" className="h-7 text-xs">
        Home
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs bg-accent text-accent-foreground">
        Products
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs">
        Docs
      </Button>
    </div>
  ),
  'sidebar-nav': () => (
    <div className="flex flex-col gap-0.5 w-[140px] rounded-md border bg-background p-1">
      <div className="flex items-center gap-2 rounded px-2 py-1 bg-accent text-accent-foreground text-xs">
        <Home className="h-3 w-3" />
        <span>Dashboard</span>
      </div>
      <div className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground">
        <Folder className="h-3 w-3" />
        <span>Projects</span>
      </div>
      <div className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground">
        <Circle className="h-3 w-3" />
        <span>Settings</span>
      </div>
    </div>
  ),
  tabs: () => (
    <Tabs defaultValue="account" className="w-[200px]">
      <TabsList className="grid grid-cols-2 h-7">
        <TabsTrigger value="account" className="text-xs h-5 py-0">
          Account
        </TabsTrigger>
        <TabsTrigger value="password" className="text-xs h-5 py-0">
          Password
        </TabsTrigger>
      </TabsList>
    </Tabs>
  ),
  breadcrumb: () => (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
      <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-foreground">
        Home
      </a>
      <ChevronRight className="h-3 w-3" />
      <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-foreground">
        Products
      </a>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">Shoe</span>
    </nav>
  ),
  pagination: () => (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs">
        ‹
      </Button>
      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-xs">
        1
      </Button>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs bg-accent">
        2
      </Button>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs">
        3
      </Button>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs">
        ›
      </Button>
    </div>
  ),
  stepper: () => (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-col items-center gap-1">
        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
          1
        </div>
        <span className="text-[10px] text-foreground">Cart</span>
      </div>
      <div className="h-px w-4 bg-border mb-4" />
      <div className="flex flex-col items-center gap-1">
        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
          2
        </div>
        <span className="text-[10px] text-foreground">Ship</span>
      </div>
      <div className="h-px w-4 bg-border mb-4" />
      <div className="flex flex-col items-center gap-1">
        <div className="h-5 w-5 rounded-full border border-border text-muted-foreground text-[10px] font-medium flex items-center justify-center">
          3
        </div>
        <span className="text-[10px] text-muted-foreground">Pay</span>
      </div>
    </div>
  ),
  'command-menu': () => (
    <div className="w-[200px] rounded-md border bg-popover shadow-md overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1.5 border-b">
        <Search className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Type a command…</span>
      </div>
      <div className="p-1 space-y-0.5">
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-accent text-accent-foreground text-xs">
          <Circle className="h-3 w-3" />
          <span>Profile</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 rounded text-xs text-foreground">
          <Circle className="h-3 w-3" />
          <span>Settings</span>
        </div>
      </div>
    </div>
  ),

  // data
  table: () => (
    <div className="w-[200px] rounded-md border overflow-hidden text-xs">
      <div className="grid grid-cols-3 bg-muted text-muted-foreground font-medium px-2 py-1">
        <span>Name</span>
        <span>Role</span>
        <span className="text-right">Status</span>
      </div>
      <div className="grid grid-cols-3 px-2 py-1 border-t text-foreground">
        <span>Alice</span>
        <span>Admin</span>
        <span className="text-right text-primary">Active</span>
      </div>
      <div className="grid grid-cols-3 px-2 py-1 border-t text-foreground">
        <span>Bob</span>
        <span>Member</span>
        <span className="text-right text-muted-foreground">Pending</span>
      </div>
    </div>
  ),
  list: () => (
    <div className="w-[180px] space-y-0.5">
      <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent text-xs text-foreground">
        <Checkbox defaultChecked className="h-3 w-3" />
        <span className="line-through text-muted-foreground">Ship v1</span>
      </div>
      <div className="flex items-center gap-2 px-2 py-1 rounded text-xs text-foreground">
        <Checkbox className="h-3 w-3" />
        <span>Write docs</span>
      </div>
      <div className="flex items-center gap-2 px-2 py-1 rounded text-xs text-foreground">
        <Checkbox className="h-3 w-3" />
        <span>Celebrate</span>
      </div>
    </div>
  ),
  tree: () => (
    <div className="w-[160px] text-xs text-foreground font-mono space-y-0.5">
      <div className="flex items-center gap-1">
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
        <Folder className="h-3 w-3 text-primary" />
        <span>src</span>
      </div>
      <div className="flex items-center gap-1 pl-4">
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <Folder className="h-3 w-3 text-muted-foreground" />
        <span>components</span>
      </div>
      <div className="flex items-center gap-1 pl-4">
        <span className="w-3" />
        <Circle className="h-2 w-2 text-muted-foreground" />
        <span>index.ts</span>
      </div>
    </div>
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
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-medium">
          +3
        </AvatarFallback>
      </Avatar>
    </div>
  ),
  calendar: () => (
    <div className="w-[160px] text-xs text-foreground">
      <div className="flex items-center justify-between mb-1 text-[10px]">
        <span className="font-medium">Feb 2026</span>
        <div className="flex gap-1 text-muted-foreground">
          <span>‹</span>
          <span>›</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[9px] text-muted-foreground mb-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-center">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[9px]">
        {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => (
          <span
            key={d}
            className={`text-center rounded py-0.5 ${
              d === 7
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  ),
  kanban: () => (
    <div className="flex gap-1.5 text-[10px]">
      {['Todo', 'Doing', 'Done'].map((col, ci) => (
        <div key={col} className="flex flex-col gap-1 w-[54px]">
          <div className="text-muted-foreground font-medium text-center">
            {col}
          </div>
          <div className="flex flex-col gap-1">
            {Array.from({ length: ci === 1 ? 2 : 1 }, (_, i) => (
              <div
                key={i}
                className="rounded border bg-card text-card-foreground p-1 shadow-sm"
              >
                <div className="h-1 w-6 rounded bg-primary/40 mb-0.5" />
                <div className="h-0.5 w-10 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  chart: () => (
    <svg
      width="180"
      height="60"
      viewBox="0 0 180 60"
      className="text-primary"
    >
      {[28, 44, 18, 52, 34, 48, 26, 58, 38].map((h, i) => (
        <rect
          key={i}
          x={i * 20 + 2}
          y={60 - h}
          width={14}
          height={h}
          rx={2}
          className="fill-current"
          opacity={0.6 + (i / 18)}
        />
      ))}
    </svg>
  ),
  stat: () => (
    <div className="text-foreground">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        MRR
      </div>
      <div className="font-display text-2xl leading-none tabular-nums">
        $24.8k
      </div>
      <div className="text-[10px] text-primary mt-0.5 tabular-nums">
        +12.4% · last 30d
      </div>
    </div>
  ),
};

export function hasPreview(componentId: string): boolean {
  return componentId in COMPONENT_PREVIEWS;
}
