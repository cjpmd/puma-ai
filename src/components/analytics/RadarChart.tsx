import { ResponsiveContainer, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface RadarChartProps {
  data: { name: string; value: number }[];
  title: string;
}

export const RadarChart = ({ data, title }: RadarChartProps) => {
  // Remove duplicate entries by name
  const uniqueData = data.reduce((acc, current) => {
    const existingItem = acc.find(item => item.name === current.name);
    if (!existingItem) {
      acc.push(current);
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Calculate the domain dynamically based on the unique data
  const maxValue = Math.max(...uniqueData.map(d => d.value));
  const domain: [number, number] = [0, Math.ceil(maxValue * 1.1)]; // Add 10% padding

  return (
    <div className="h-64">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={uniqueData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis domain={domain} />
          <Radar
            name="Attributes"
            dataKey="value"
            stroke="#4ADE80"
            fill="#4ADE80"
            fillOpacity={0.6}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};