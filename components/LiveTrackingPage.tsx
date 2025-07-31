'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { MapPin, Clock, Users, Activity, Search, Filter, Eye, Edit, Play, Pause, CheckCircle, AlertCircle, Circle, User, UserCheck, X, ExternalLink } from "lucide-react"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"

// Enhanced mock data for jobs with lead and labour assignments
const mockJobs = [
  {
    id: "JOB-001",
    name: "Kitchen Renovation",
    assignedLead: "Mike Johnson",
    assignedLabour: ["John Smith", "Robert Wilson"],
    status: "In Progress",
    timeLeft: "4h 30m",
    location: { lat: 40.7128, lng: -74.0060, address: "123 Main St, New York, NY" },
    progress: 65,
    customer: "Sarah Wilson",
    priority: "High",
    startTime: "08:00 AM",
    estimatedCompletion: "05:30 PM",
    description: "Complete kitchen renovation including cabinet installation, countertops, and plumbing updates.",
    budget: "$15,000",
    tools: ["Drill", "Saw", "Level", "Wrench Set"],
    materials: ["Kitchen Cabinets", "Granite Countertop", "Sink", "Faucet"]
  },
  {
    id: "JOB-002", 
    name: "Bathroom Plumbing",
    assignedLead: "Robert Davis",
    assignedLabour: ["Carlos Martinez"],
    status: "Pending",
    timeLeft: "8h 00m",
    location: { lat: 40.7589, lng: -73.9851, address: "456 Oak Ave, New York, NY" },
    progress: 0,
    customer: "David Brown",
    priority: "Medium",
    startTime: "09:00 AM",
    estimatedCompletion: "05:00 PM",
    description: "Full bathroom plumbing repair and fixture replacement.",
    budget: "$8,500",
    tools: ["Pipe Wrench", "Torch", "Pipe Cutter"],
    materials: ["Toilet", "Sink", "Pipes", "Fittings"]
  },
  {
    id: "JOB-003",
    name: "Electrical Wiring",
    assignedLead: "Emily Chen",
    assignedLabour: ["Carlos Rodriguez", "Alex Turner"],
    status: "Completed",
    timeLeft: "Completed",
    location: { lat: 40.7831, lng: -73.9712, address: "789 Pine St, New York, NY" },
    progress: 100,
    customer: "Lisa Garcia",
    priority: "Low",
    startTime: "07:00 AM",
    estimatedCompletion: "03:00 PM",
    description: "Electrical system upgrade and outlet installation.",
    budget: "$12,000",
    tools: ["Wire Strippers", "Multimeter", "Drill"],
    materials: ["Electrical Wire", "Outlets", "Circuit Breakers"]
  },
  {
    id: "JOB-004",
    name: "HVAC Installation",
    assignedLead: "Alex Thompson",
    assignedLabour: ["David Kim"],
    status: "In Progress",
    timeLeft: "2h 15m",
    location: { lat: 40.7505, lng: -73.9934, address: "321 Elm St, New York, NY" },
    progress: 80,
    customer: "Mark Johnson",
    priority: "High",
    startTime: "08:30 AM",
    estimatedCompletion: "04:45 PM",
    description: "Complete HVAC system installation for residential property.",
    budget: "$18,000",
    tools: ["Refrigerant Gauges", "Torch", "Pipe Bender"],
    materials: ["HVAC Unit", "Ductwork", "Refrigerant", "Thermostat"]
  }
]

// Mock data for laborers
const mockLaborers = [
  {
    id: "LAB-001",
    name: "John Smith",
    currentJob: "JOB-001",
    jobName: "Kitchen Renovation",
    location: { lat: 40.7128, lng: -74.0060, address: "123 Main St, New York, NY" },
    status: "Working",
    hoursWorked: "6h 30m",
    specialty: "Carpentry",
    lastUpdate: "2 min ago",
    phone: "(555) 123-4567"
  },
  {
    id: "LAB-002",
    name: "Mike Johnson", 
    currentJob: "JOB-001",
    jobName: "Kitchen Renovation",
    location: { lat: 40.7128, lng: -74.0060, address: "123 Main St, New York, NY" },
    status: "Working",
    hoursWorked: "6h 30m",
    specialty: "Plumbing",
    lastUpdate: "1 min ago",
    phone: "(555) 234-5678"
  },
  {
    id: "LAB-003",
    name: "Robert Davis",
    currentJob: null,
    jobName: null,
    location: { lat: 40.7505, lng: -73.9934, address: "Office - 321 Elm St, New York, NY" },
    status: "Available",
    hoursWorked: "0h 00m",
    specialty: "Plumbing",
    lastUpdate: "5 min ago",
    phone: "(555) 345-6789"
  },
  {
    id: "LAB-004",
    name: "Emily Chen",
    currentJob: "JOB-003",
    jobName: "Electrical Wiring",
    location: { lat: 40.7831, lng: -73.9712, address: "789 Pine St, New York, NY" },
    status: "Completed",
    hoursWorked: "8h 00m",
    specialty: "Electrical",
    lastUpdate: "30 min ago",
    phone: "(555) 456-7890"
  },
  {
    id: "LAB-005",
    name: "Carlos Rodriguez",
    currentJob: "JOB-003",
    jobName: "Electrical Wiring", 
    location: { lat: 40.7831, lng: -73.9712, address: "789 Pine St, New York, NY" },
    status: "Completed",
    hoursWorked: "8h 00m",
    specialty: "Electrical",
    lastUpdate: "30 min ago",
    phone: "(555) 567-8901"
  },
  {
    id: "LAB-006",
    name: "Alex Thompson",
    currentJob: "JOB-004",
    jobName: "HVAC Installation",
    location: { lat: 40.7505, lng: -73.9934, address: "321 Elm St, New York, NY" },
    status: "Working",
    hoursWorked: "5h 45m",
    specialty: "HVAC",
    lastUpdate: "Just now",
    phone: "(555) 678-9012"
  }
]

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "In Progress":
      case "Working":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Pending":
      case "Available":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-3 h-3" />
      case "In Progress":
      case "Working":
        return <Play className="w-3 h-3" />
      case "Pending":
      case "Available":
        return <Circle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  return (
    <Badge className={`${getStatusColor(status)} flex items-center gap-1`}>
      {getStatusIcon(status)}
      {status}
    </Badge>
  )
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Badge className={getPriorityColor(priority)}>
      {priority}
    </Badge>
  )
}

// Job Details Modal Component
const JobDetailsModal = ({ job, onViewCompleteJob }: { job: any, onViewCompleteJob: (jobId: string) => void }) => {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          {job.name}
        </DialogTitle>
        <DialogDescription>
          Job ID: {job.id} • Customer: {job.customer}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Status and Progress */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <StatusBadge status={job.status} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Priority</label>
            <PriorityBadge priority={job.priority} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Progress</label>
            <div className="space-y-1">
              <Progress value={job.progress} className="w-full" />
              <span className="text-sm text-muted-foreground">{job.progress}%</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Time and Location */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Time:</span>
                <span>{job.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Completion:</span>
                <span>{job.estimatedCompletion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Remaining:</span>
                <span className="font-medium text-primary">{job.timeLeft}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h4>
            <div className="text-sm">
              <p>{job.location.address}</p>
              <p className="text-muted-foreground">Budget: {job.budget}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Team Assignment */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team Assignment
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Assigned Lead</label>
              <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                <UserCheck className="w-4 h-4 text-primary" />
                <span className="font-medium">{job.assignedLead}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Assigned Labour</label>
              <div className="space-y-1">
                {job.assignedLabour.map((labor: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg border border-secondary">
                    <User className="w-4 h-4 text-secondary-foreground" />
                    <span className="text-sm">{labor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Job Description */}
        <div className="space-y-2">
          <h4 className="font-medium">Description</h4>
          <p className="text-sm text-muted-foreground">{job.description}</p>
        </div>

        {/* Tools and Materials */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium">Required Tools</h4>
            <div className="flex flex-wrap gap-1">
              {job.tools.map((tool: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Materials</h4>
            <div className="flex flex-wrap gap-1">
              {job.materials.map((material: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {material}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          Update Status
        </Button>
        <Button onClick={() => onViewCompleteJob(job.id)} className="bg-primary text-primary-foreground">
          <ExternalLink className="w-4 h-4 mr-2" />
          View Complete Job
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function LiveTrackingPage() {
  const [activeTab, setActiveTab] = useState("jobs")
  const [jobStatusFilter, setJobStatusFilter] = useState("all")
  const [laborStatusFilter, setLaborStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMapFilter, setSelectedMapFilter] = useState("all")
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showJobModal, setShowJobModal] = useState(false)

  // Filter jobs based on status and search
  const filteredJobs = mockJobs.filter(job => {
    const matchesStatus = jobStatusFilter === "all" || job.status === jobStatusFilter
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Filter laborers based on status and search
  const filteredLaborers = mockLaborers.filter(laborer => {
    const matchesStatus = laborStatusFilter === "all" || laborer.status === laborStatusFilter
    const matchesSearch = laborer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         laborer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (laborer.jobName && laborer.jobName.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const handleUpdateJobStatus = (jobId: string, newStatus: string) => {
    console.log(`Updating job ${jobId} status to ${newStatus}`)
  }

  const handleUpdateLaborStatus = (laborId: string, newStatus: string) => {
    console.log(`Updating labor ${laborId} status to ${newStatus}`)
  }

  const handleViewJob = (job: any) => {
    setSelectedJob(job)
    setShowJobModal(true)
  }

  const handleViewCompleteJob = (jobId: string) => {
    setShowJobModal(false)
    // Navigate to job details page
    console.log(`Navigating to complete job details for ${jobId}`)
    // You can implement navigation logic here
  }

  const getMapPinColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "#10B981" // Green
      case "In Progress":
      case "Working":
        return "#00A1FF" // Blue
      case "Pending":
      case "Available":
        return "#F59E0B" // Yellow
      default:
        return "#6B7280" // Gray
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Live Tracking</h1>
          <p className="text-muted-foreground">Real-time tracking of jobs and labor activities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            Last updated: Just now
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="jobs" 
            className={`flex items-center gap-2 ${activeTab === "jobs" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <Activity className="w-4 h-4" />
            Job Tracking
          </TabsTrigger>
          <TabsTrigger 
            value="labor" 
            className={`flex items-center gap-2 ${activeTab === "labor" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <Users className="w-4 h-4" />
            Labor Tracking
          </TabsTrigger>
          <TabsTrigger 
            value="map" 
            className={`flex items-center gap-2 ${activeTab === "map" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <MapPin className="w-4 h-4" />
            Live Map
          </TabsTrigger>
        </TabsList>

        {/* Live Job Tracking Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Live Job Tracking
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                    <SelectTrigger className={`w-40 ${jobStatusFilter !== "all" ? "bg-primary text-primary-foreground" : ""}`}>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Details</TableHead>
                    <TableHead>Team Assignment</TableHead>
                    <TableHead>Status & Progress</TableHead>
                    <TableHead>Time & Location</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{job.name}</p>
                          <p className="text-sm text-muted-foreground">{job.id}</p>
                          <p className="text-sm text-muted-foreground">Customer: {job.customer}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3">
                          {/* Assigned Lead */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned Lead</label>
                            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-md border border-primary/10">
                              <UserCheck className="w-3 h-3 text-primary" />
                              <span className="text-sm font-medium">{job.assignedLead}</span>
                            </div>
                          </div>
                          
                          {/* Assigned Labour */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned Labour</label>
                            <div className="space-y-1">
                              {job.assignedLabour.map((labor, index) => (
                                <div key={index} className="flex items-center gap-2 p-1.5 bg-secondary/30 rounded-md border border-secondary/50">
                                  <User className="w-3 h-3 text-secondary-foreground" />
                                  <span className="text-sm">{labor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <StatusBadge status={job.status} />
                          {job.status !== "Completed" && (
                            <div className="space-y-1">
                              <Progress value={job.progress} className="w-20" />
                              <span className="text-xs text-muted-foreground">{job.progress}%</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{job.timeLeft}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{job.location.address}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {job.startTime} - {job.estimatedCompletion}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={job.priority} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog open={showJobModal && selectedJob?.id === job.id} onOpenChange={(open) => {
                            if (!open) {
                              setShowJobModal(false)
                              setSelectedJob(null)
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleViewJob(job)}>
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            {selectedJob && <JobDetailsModal job={selectedJob} onViewCompleteJob={handleViewCompleteJob} />}
                          </Dialog>
                          <Select onValueChange={(value) => handleUpdateJobStatus(job.id, value)}>
                            <SelectTrigger className="w-32 h-8">
                              <Edit className="w-3 h-3 mr-1" />
                              <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Labor Tracking Tab */}
        <TabsContent value="labor" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Live Labor Tracking
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search laborers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={laborStatusFilter} onValueChange={setLaborStatusFilter}>
                    <SelectTrigger className={`w-40 ${laborStatusFilter !== "all" ? "bg-primary text-primary-foreground" : ""}`}>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Working">Working</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Labor Details</TableHead>
                    <TableHead>Current Assignment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location & Contact</TableHead>
                    <TableHead>Hours Worked</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLaborers.map((laborer) => (
                    <TableRow key={laborer.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{laborer.name}</p>
                          <p className="text-sm text-muted-foreground">{laborer.id}</p>
                          <p className="text-sm text-muted-foreground">Specialty: {laborer.specialty}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {laborer.currentJob ? (
                            <>
                              <p className="text-sm font-medium">{laborer.jobName}</p>
                              <p className="text-xs text-muted-foreground">{laborer.currentJob}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">No active assignment</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <StatusBadge status={laborer.status} />
                          <p className="text-xs text-muted-foreground">Updated: {laborer.lastUpdate}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">{laborer.location.address}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{laborer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{laborer.hoursWorked}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Select onValueChange={(value) => handleUpdateLaborStatus(laborer.id, value)}>
                            <SelectTrigger className="w-32 h-8">
                              <Edit className="w-3 h-3 mr-1" />
                              <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Available">Available</SelectItem>
                              <SelectItem value="Working">Working</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Map Tab */}
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Live Map Tracking
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedMapFilter} onValueChange={setSelectedMapFilter}>
                    <SelectTrigger className={`w-48 ${selectedMapFilter !== "all" ? "bg-primary text-primary-foreground" : ""}`}>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter Map View" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Show All</SelectItem>
                      <SelectItem value="jobs">Jobs Only</SelectItem>
                      <SelectItem value="laborers">Laborers Only</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Map Display */}
                <div className="lg:col-span-3">
                  <div className="bg-muted rounded-lg h-96 relative overflow-hidden">
                    {/* Mock Map Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100">
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300A1FF' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                      }}>
                      </div>
                    </div>

                    {/* Map Pins for Jobs */}
                    {(selectedMapFilter === "all" || selectedMapFilter === "jobs") && 
                      filteredJobs.map((job, index) => (
                        <div
                          key={job.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                          style={{
                            left: `${25 + (index * 20)}%`,
                            top: `${30 + (index * 15)}%`
                          }}
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg"
                            style={{ backgroundColor: getMapPinColor(job.status) }}
                          >
                            <Activity className="w-4 h-4" />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-lg shadow-lg p-3 text-sm whitespace-nowrap border">
                              <p className="font-medium">{job.name}</p>
                              <p className="text-muted-foreground">{job.id}</p>
                              <p className="text-xs mt-1">{job.location.address}</p>
                              <StatusBadge status={job.status} />
                            </div>
                          </div>
                        </div>
                      ))
                    }

                    {/* Map Pins for Laborers */}
                    {(selectedMapFilter === "all" || selectedMapFilter === "laborers") && 
                      filteredLaborers.map((laborer, index) => (
                        <div
                          key={laborer.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                          style={{
                            left: `${60 + (index * 15)}%`,
                            top: `${20 + (index * 12)}%`
                          }}
                        >
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white"
                            style={{ backgroundColor: getMapPinColor(laborer.status) }}
                          >
                            <Users className="w-3 h-3" />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-lg shadow-lg p-3 text-sm whitespace-nowrap border">
                              <p className="font-medium">{laborer.name}</p>
                              <p className="text-muted-foreground">{laborer.specialty}</p>
                              {laborer.currentJob && <p className="text-xs">{laborer.jobName}</p>}
                              <StatusBadge status={laborer.status} />
                            </div>
                          </div>
                        </div>
                      ))
                    }

                    {/* Map Controls */}
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">+</Button>
                        <Button variant="outline" size="sm">-</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend and Summary */}
                <div className="space-y-4">
                  {/* Legend */}
                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="font-medium">Map Legend</h3>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Jobs</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                              <Activity className="w-2 h-2 text-white" />
                            </div>
                            <span className="text-xs">Completed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <Activity className="w-2 h-2 text-white" />
                            </div>
                            <span className="text-xs">In Progress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                              <Activity className="w-2 h-2 text-white" />
                            </div>
                            <span className="text-xs">Pending</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Laborers</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                              <Users className="w-2 h-2 text-white" />
                            </div>
                            <span className="text-xs">Working</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center">
                              <Users className="w-2 h-2 text-white" />
                            </div>
                            <span className="text-xs">Available</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="font-medium">Live Statistics</h3>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-primary">{mockJobs.filter(j => j.status === "In Progress").length}</p>
                          <p className="text-xs text-muted-foreground">Active Jobs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-green-600">{mockJobs.filter(j => j.status === "Completed").length}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-primary">{mockLaborers.filter(l => l.status === "Working").length}</p>
                          <p className="text-xs text-muted-foreground">Working</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-yellow-600">{mockLaborers.filter(l => l.status === "Available").length}</p>
                          <p className="text-xs text-muted-foreground">Available</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}