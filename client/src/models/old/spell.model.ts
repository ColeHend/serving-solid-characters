export interface Spell {
  name:             string;
  description:             string;
  duration:         string;
  is_concentration:    boolean;
  components: string;
  level:            string;
  range:            string;
  is_ritual:           boolean;
  school:           string;
  casting_time:      string;
  damage_type:       string;
  page:             string;
  isMaterial:       boolean;
  isSomatic:        boolean;
  isVerbal:         boolean;
  materials_Needed?: string;
  classes:          string[];
  subClasses:       string[];
}