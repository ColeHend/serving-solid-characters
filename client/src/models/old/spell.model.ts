export interface Spell {
  name:             string;
  desc:             string;
  duration:         string;
  concentration:    boolean;
  level:            string;
  range:            string;
  ritual:           boolean;
  school:           string;
  castingTime:      string;
  damageType:       string;
  page:             string;
  isMaterial:       boolean;
  isSomatic:        boolean;
  isVerbal:         boolean;
  materials_Needed?: string;
  higherLevel:      string;
  classes:          string[];
  subClasses:       string[];
}