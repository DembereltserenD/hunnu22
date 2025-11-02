import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { PhoneIssueForm } from '@/components/admin/phone-issue-form';
import { getPhoneIssue } from '../../actions';
import { getApartmentsForSelect, getWorkersForSelect } from '../../actions';

interface EditPhoneIssuePageProps {
    params: {
        id: string;
    };
}

function LoadingSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

async function EditPhoneIssueForm({ id }: { id: string }) {
    try {
        const [phoneIssue, apartments, workers] = await Promise.all([
            getPhoneIssue(id),
            getApartmentsForSelect(),
            getWorkersForSelect()
        ]);

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Edit Phone Issue</CardTitle>
                    <CardDescription>
                        Update phone issue details and status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PhoneIssueForm
                        phoneIssue={phoneIssue}
                        apartments={apartments}
                        workers={workers}
                    />
                </CardContent>
            </Card>
        );
    } catch (error) {
        notFound();
    }
}

export default function EditPhoneIssuePage({ params }: EditPhoneIssuePageProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin-hunnu/phone-issues">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Phone Issues
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Phone Issue</h1>
                    <p className="text-muted-foreground">
                        Update phone issue information and status
                    </p>
                </div>
            </div>

            <Suspense fallback={<LoadingSkeleton />}>
                <EditPhoneIssueForm id={params.id} />
            </Suspense>
        </div>
    );
}