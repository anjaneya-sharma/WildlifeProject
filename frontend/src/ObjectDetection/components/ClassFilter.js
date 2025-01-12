import React, { useEffect, useRef, useState } from 'react';
import { getImages } from '../api/imageApi';
import styles from './styles.module.css'

const CLASS_OPTIONS = [
  { id: 'All', name: 'All' },
  { id: 0, name: 'anat_elli' },
  { id: 1, name: 'anti_cerv' },
  { id: 2, name: 'arct_coll' },
  { id: 3, name: 'athe_macr' },
  { id: 4, name: 'axis_axis' },
  { id: 5, name: 'axis_porc' },
  { id: 6, name: 'bats_bats' },
  { id: 7, name: 'bird_bird' },
  { id: 8, name: 'blan_blan' },
  { id: 9, name: 'bos__fron' },
  { id: 10, name: 'bos__gaur' },
  { id: 11, name: 'bos__indi' },
  { id: 12, name: 'bose_trag-Boselaphus tragocamelus' },
  { id: 13, name: 'budo_taxi-Budorcas taxicolor' },
  { id: 14, name: 'call_pyge-Callosciurus pygerythrus' },
  { id: 15, name: 'came_came-Camel' },
  { id: 16, name: 'cani_aure-Canis aureus' },
  { id: 17, name: 'cani_lupu-Canis lupus' },
  { id: 18, name: 'capr_hisp-Caprolagus hispidus' },
  { id: 19, name: 'capr_thar-Capricornis thar' },
  { id: 20, name: 'cato_temm-Catopuma temminckii' },
  { id: 21, name: 'catt_catt-Cattle' },
  { id: 22, name: 'catt_kill' },
  { id: 23, name: 'cuon_alpi-Cuon alpinus' },
  { id: 24, name: 'dome_cats-Domestic cat' },
  { id: 25, name: 'dome_dogs-Domestic dog' },
  { id: 26, name: 'elep_maxi-Elephas maximus' },
  { id: 27, name: 'equu_caba-Equus caballus' },
  { id: 28, name: 'feli_chau-Felis chaus' },
  { id: 29, name: 'feli_sylv-Felis sylvestris' },
  { id: 30, name: 'fran_pond-Francolinus pondicerianus' },
  { id: 31, name: 'funa_palm-Funambulus palmarum' },
  { id: 32, name: 'gall_gall-Gallus gallus' },
  { id: 33, name: 'gall_lunu-Galloperdix lunulata' },
  { id: 34, name: 'gall_sonn-Gallus sonneratii' },
  { id: 35, name: 'gall_spad-Galloperdix spadicea' },
  { id: 36, name: 'gaze_benn-Gazella bennettii' },
  { id: 37, name: 'goat_sheep' },
  { id: 38, name: 'hela_mala-Helarctos malayanus' },
  { id: 39, name: 'herp_edwa-Herpestes edwardsii' },
  { id: 40, name: 'herp_fusc-Herpestes fuscus' },
  { id: 41, name: 'herp_smit-Herpestes smithii' },
  { id: 42, name: 'herp_urva-Herpestes urva' },
  { id: 43, name: 'herp_vitt-Herpestes vitticollis' },
  { id: 44, name: 'homo_sapi' },
  { id: 45, name: 'hyae_hyae-Hyaena hyaena' },
  { id: 46, name: 'hyst_brac-Hystrix brachyura' },
  { id: 47, name: 'hyst_indi-Hystrix indica' },
  { id: 48, name: 'lept_java-Leptoptilos javanicus' },
  { id: 49, name: 'lepu_nigr-Lepus nigricollis' },
  { id: 50, name: 'lutr_lutr-Lutra lutra' },
  { id: 51, name: 'lutr_pers-Lutrogale perspicillata' },
  { id: 52, name: 'maca_arct-Macaca arctoides' },
  { id: 53, name: 'maca_assa-Macaca assamensis' },
  { id: 54, name: 'maca_leon-Macaca leonina' },
  { id: 55, name: 'maca_maca-Macaque' },
  { id: 56, name: 'maca_mula-Macaca mulatta' },
  { id: 57, name: 'maca_munz-Macaca munzala' },
  { id: 58, name: 'maca_radi-Macaca radiata' },
  { id: 59, name: 'maca_sile-Macaca silenus' },
  { id: 60, name: 'mani_cras-Manis crassicaudata' },
  { id: 61, name: 'mart_flav-Martes flavigula' },
  { id: 62, name: 'mart_gwat-Martes gwatkinsii' },
  { id: 63, name: 'mell_cape-Mellivora capensis' },
  { id: 64, name: 'melo_pers' },
  { id: 65, name: 'melu_ursi' },
  { id: 66, name: 'mosc_indi-Moschiola indica' },
  { id: 67, name: 'munt_munt-Muntiacus muntjak' },
  { id: 68, name: 'naem_gora-Naemorhedus goral' },
  { id: 69, name: 'neof_nebu-Neofelis nebulosa' },
  { id: 70, name: 'nilg_hylo-Nilgiritragus hylocrius' },
  { id: 71, name: 'pagu_larv-Paguma larvata-Masked Palm Civet' },
  { id: 72, name: 'pant_pard-Panthera pardus' },
  { id: 73, name: 'pant_tigr' },
  { id: 74, name: 'para-jerd-Paradoxurus jerdoni' },
  { id: 75, name: 'para_herm-Paradoxurus hermaphroditus' },
  { id: 76, name: 'pard_marm-Pardofelis marmorata' },
  { id: 77, name: 'pavo_cris' },
  { id: 78, name: 'prio_beng-Prionailurus bengalensis' },
  { id: 79, name: 'prio_pard-Prionodon pardicolor' },
  { id: 80, name: 'prio_rubi-Prionailurus rubiginosus' },
  { id: 81, name: 'prio_vive-Prionailurus viverrinus' },
  { id: 82, name: 'rusa_unic-Rusa unicolor' },
  { id: 83, name: 'semn_ente-Semnopithecus entellus' },
  { id: 84, name: 'semn_john+Semnopithecus johnii' },
  { id: 85, name: 'sus__scro-Sus scrofa' },
  { id: 86, name: 'tetr_quad-Tetracerus quadricornis' },
  { id: 87, name: 'trac_john-Trachypithecus johnii' },
  { id: 88, name: 'trac_pile-Trachypithecus pileatus' },
  { id: 89, name: 'tree_shre' },
  { id: 90, name: 'ursu_thib-Ursus thibetanus' },
  { id: 91, name: 'vara_beng-Varanus bengalensis' },
  { id: 92, name: 'vara_salv-Varanus salvator' },
  { id: 93, name: 'vehi_vehi' },
  { id: 94, name: 'vive_indi-Viverricula indica' },
  { id: 95, name: 'vive_zibe-Viverra zibetha' },
  { id: 96, name: 'vulp_beng' },
  { id: 97, name: 'vulp_vulp' }
];

const ClassFilter = ({ onClassSelect, selectedClass, setImages, setClassList }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classListLocal, setClassListLocal] = useState(CLASS_OPTIONS);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setClassList(CLASS_OPTIONS.filter(cls => cls.id !== 'All'));
  }, [setClassList]);

  const handleClassSelect = async (classOption) => {
    onClassSelect(classOption.id);
    setDropdownOpen(false);
    setSearchQuery('');

    try {
      const images = await getImages(classOption.id); 
      setImages(images);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const filteredClasses = classListLocal.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles["navigation-container"]}>
      <div className={styles["filter-container"]} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!isDropdownOpen)}
          className={styles["filter-button"]}
        >
          <span>{selectedClass !== 'All' ? CLASS_OPTIONS.find(opt => opt.id === selectedClass)?.name : 'All'}</span>
          <span className={`${styles['arrow']} ${isDropdownOpen ? styles['up'] : styles['down']}`}>▼</span>
        </button>

        {isDropdownOpen && (
          <div className={styles["dropdown-menu"]}>
            <div className={styles["search-container"]}>
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles["search-input"]}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className={styles["class-list"]}>
              {filteredClasses.map((classOption) => (
                <button
                  key={classOption.id}
                  onClick={() => handleClassSelect(classOption)}
                  className={`${styles['class-option']} ${selectedClass === classOption.id ? styles['selected'] : ''}`}
                >
                  {classOption.name}
                </button>
              ))}
              {filteredClasses.length === 0 && (
                <div className={styles["no-results"]}>No matching classes found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassFilter;