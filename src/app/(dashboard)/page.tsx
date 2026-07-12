<<<<<<< Updated upstream
import { prisma } from "@/lib/prisma";
=======
import { prisma } from "@/lib/db";
>>>>>>> Stashed changes
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function DashboardPage() {
  const activeVehiclesCount = await prisma.vehicle.count({ where: { status: "available" } });
  const totalVehiclesCount = await prisma.vehicle.count();
  const onTripVehiclesCount = await prisma.vehicle.count({ where: { status: "on_trip" } });
  
  const activeTripsCount = await prisma.trip.count({ where: { status: "dispatched" } });
  const pendingTripsCount = await prisma.trip.count({ where: { status: "draft" } });
  
  const driversOnDutyCount = await prisma.driver.count({ where: { status: "on_trip" } });
  
  const utilization = totalVehiclesCount > 0 
    ? Math.round((onTripVehiclesCount / totalVehiclesCount) * 100) 
    : 0;

  const recentTrips = await prisma.trip.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: true,
      driver: true,
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your fleet operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVehiclesCount}</div>
            <p className="text-xs text-muted-foreground">Ready for dispatch</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTripsCount}</div>
            <p className="text-xs text-muted-foreground">Currently on the road</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drivers on Duty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driversOnDutyCount}</div>
            <p className="text-xs text-muted-foreground">Assigned to active trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilization}%</div>
            <p className="text-xs text-muted-foreground">Of total fleet</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No trips found.</TableCell>
                </TableRow>
              ) : (
                recentTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono">{trip.code || "T-" + trip.id}</TableCell>
                    <TableCell>{trip.source}</TableCell>
                    <TableCell>{trip.destination}</TableCell>
                    <TableCell>{trip.vehicle?.name || "Unassigned"}</TableCell>
                    <TableCell>{trip.driver?.name || "Unassigned"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${trip.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                        ${trip.status === "dispatched" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : ""}
                        ${trip.status === "draft" ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" : ""}
                      `}>
                        {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
