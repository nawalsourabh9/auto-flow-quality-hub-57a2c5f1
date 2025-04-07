
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { month: 'Jan', nonConformances: 14, corrActions: 12, audits: 1 },
  { month: 'Feb', nonConformances: 16, corrActions: 14, audits: 0 },
  { month: 'Mar', nonConformances: 12, corrActions: 15, audits: 2 },
  { month: 'Apr', nonConformances: 9, corrActions: 11, audits: 0 },
  { month: 'May', nonConformances: 8, corrActions: 9, audits: 1 },
  { month: 'Jun', nonConformances: 10, corrActions: 8, audits: 0 },
];

export function QualityMetricsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Metrics</CardTitle>
        <CardDescription>6-month trend of key quality indicators</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="nonConformances" name="Non-Conformances" fill="#dc3545" radius={[2, 2, 0, 0]} />
              <Bar dataKey="corrActions" name="Corrective Actions" fill="#0056b3" radius={[2, 2, 0, 0]} />
              <Bar dataKey="audits" name="Audits" fill="#28a745" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
