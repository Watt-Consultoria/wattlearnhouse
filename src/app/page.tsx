import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-muted">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Hello World!
            </CardTitle>
            <CardDescription>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
              euismod, nisl vel tincidunt lacinia, nunc nisl aliquam nunc, eget
              aliquam nisl nunc vel nisl.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
              euismod, nisl vel tincidunt lacinia, <strong>nunc</strong> nisl
              aliquam nunc, eget aliquam nisl nunc vel nisl.
            </p>
            <div className="rounded-lg bg-muted p-3 font-mono text-xs text-foreground">
              Code example
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline">Voltar</Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
