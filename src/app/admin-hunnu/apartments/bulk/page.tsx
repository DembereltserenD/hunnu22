import { Suspense } from 'react';
import { getApartmentsForSelect, getWorkersForSelect } from '../../phone-issues/actions';
import { getBuildingsForSelect } from '../../apartments/actions';
import { BulkPhoneIssueForm } from '@/components/admin/bulk-phone-issue-form';

export const dynamic = 'force-dynamic';

export default async function BulkImportApartmentsPage() {
    const [apartments, workers, buildings] = await Promise.all([
        getApartmentsForSelect(),
        getWorkersForSelect(),
        getBuildingsForSelect()
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Байрны өгөгдөл импортлох</h1>
                <p className="text-muted-foreground mt-2">
                    Байрны засвар үйлчилгээний өгөгдлийг кодоор оруулах: 222-106-2SD 99090909 L1-112,L1-132 эсвэл 222-901-3SD
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    Энэ нь байр бүрт хэдэн утаа мэдрэгч, домофон, эсвэл чийдэн цэвэрлэсэн тухай бичлэг үүсгэнэ. Барилгууд урьдчилан үүссэн байх ёстой.
                </p>
            </div>

            <Suspense fallback={<div>Ачааллаж байна...</div>}>
                <BulkPhoneIssueForm apartments={apartments} workers={workers} buildings={buildings} />
            </Suspense>
        </div>
    );
}