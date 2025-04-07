
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DocumentStatus {
  name: string;
  total: number;
  approved: number;
  inReview: number;
  expired: number;
  color: string;
}

const documents: DocumentStatus[] = [
  {
    name: "Procedures",
    total: 24,
    approved: 20,
    inReview: 3,
    expired: 1,
    color: "#0056b3"
  },
  {
    name: "Work Instructions",
    total: 42,
    approved: 36,
    inReview: 4,
    expired: 2,
    color: "#17a2b8"
  },
  {
    name: "Quality Records",
    total: 78,
    approved: 65,
    inReview: 10,
    expired: 3,
    color: "#28a745"
  }
];

export function DocumentsStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {documents.map((doc) => {
            const approvedPercent = Math.round((doc.approved / doc.total) * 100);
            const inReviewPercent = Math.round((doc.inReview / doc.total) * 100);
            const expiredPercent = Math.round((doc.expired / doc.total) * 100);
            
            return (
              <div key={doc.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{doc.name}</h3>
                  <span className="text-sm text-muted-foreground">{doc.approved} of {doc.total} approved</span>
                </div>
                <div className="h-2 flex rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500" 
                    style={{ width: `${approvedPercent}%` }} 
                    title={`${doc.approved} Approved`}
                  />
                  <div 
                    className="bg-amber-400" 
                    style={{ width: `${inReviewPercent}%` }} 
                    title={`${doc.inReview} In Review`}
                  />
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${expiredPercent}%` }} 
                    title={`${doc.expired} Expired`}
                  />
                </div>
                <div className="flex text-xs justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                    <span>Approved ({approvedPercent}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mr-1"></div>
                    <span>In Review ({inReviewPercent}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                    <span>Expired ({expiredPercent}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
