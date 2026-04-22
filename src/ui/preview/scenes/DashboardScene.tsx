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
import { Progress } from '../../../components/ui/progress';
import { Separator } from '../../../components/ui/separator';

const NAV_ITEMS = [
  { label: 'Overview', active: true },
  { label: 'Customers', active: false },
  { label: 'Billing', active: false },
  { label: 'Settings', active: false },
];

const STATS = [
  { label: 'MRR', value: '$48.2k', delta: '+12.4%' },
  { label: 'Active users', value: '1,284', delta: '+4.8%' },
  { label: 'Churn', value: '1.9%', delta: '-0.3%' },
];

const ACTIVITY = [
  { who: 'AM', what: 'closed an invoice', when: '2m' },
  { who: 'JY', what: 'added a new member', when: '18m' },
  { who: 'SH', what: 'upgraded to Pro', when: '1h' },
];

export function DashboardScene() {
  return (
    <div className="w-full rounded-xl border bg-background text-foreground">
      <div className="grid grid-cols-[140px_minmax(0,1fr)]">
        <aside className="border-r p-3 text-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="font-medium">Posa</span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((n) => (
              <button
                key={n.label}
                type="button"
                className={
                  n.active
                    ? 'rounded-md bg-accent px-2 py-1.5 text-left text-accent-foreground'
                    : 'rounded-md px-2 py-1.5 text-left text-muted-foreground hover:bg-muted'
                }
              >
                {n.label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Overview</h3>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </div>
            <Button size="sm">New report</Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <Card key={s.label}>
                <CardHeader className="p-3">
                  <CardDescription className="text-xs">
                    {s.label}
                  </CardDescription>
                  <CardTitle className="text-lg">{s.value}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <Badge variant="secondary">{s.delta}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Quota used</span>
              <span className="font-medium">72%</span>
            </div>
            <Progress value={72} />
          </div>
          <Separator className="my-4" />
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Recent activity
            </div>
            <ul className="flex flex-col gap-2">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{a.who}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1">
                    <span className="font-medium">{a.who}</span>{' '}
                    <span className="text-muted-foreground">{a.what}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{a.when}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
