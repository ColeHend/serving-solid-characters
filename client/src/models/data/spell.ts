export interface Spell {
  id:             string;
  name:             string;
  description:             string;
  duration:         string;
  is_concentration:    boolean;
  level:            number;
  range:            string;
  is_ritual:           boolean;
  school:           string;
  castingTime:      string;
  damageType:       string;
  page:             string;
  components:       string;
  isMaterial:       boolean;
  isSomatic:        boolean;
  isVerbal:         boolean;
  materials_Needed?: string;
  higherLevel:      string;
  classes:          string[];
  subClasses:       string[];
}