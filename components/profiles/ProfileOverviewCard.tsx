import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Shield, 
  Users, 
  HardHat, 
  Truck,
  ArrowRight 
} from 'lucide-react'
import { ProfileType } from '../../types/profiles'
import { ProfileTypeConfig } from '../../data/profilesData'

interface ProfileOverviewCardProps {
  config: ProfileTypeConfig
  onSelect: (type: ProfileType) => void
}

const iconMap = {
  Shield,
  Users,
  HardHat,
  Truck
}

export function ProfileOverviewCard({ config, onSelect }: ProfileOverviewCardProps) {
  const IconComponent = iconMap[config.icon as keyof typeof iconMap]

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{config.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(config.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-medium">{config.stats.total}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Active: </span>
              <span className="font-medium text-green-600">{config.stats.active}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Inactive: </span>
              <span className="font-medium text-red-600">{config.stats.inactive}</span>
            </div>
          </div>
          <Badge 
            className={`${config.stats.active > config.stats.inactive 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : 'bg-orange-100 text-orange-800 border-orange-200'
            }`}
          >
            {config.stats.active > config.stats.inactive ? 'Healthy' : 'Attention'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}