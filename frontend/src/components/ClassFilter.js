import React, { useEffect, useRef, useState } from 'react';
import { fetchImages } from '../api/imageApi';

const CLASS_OPTIONS = [
  'all',
  'mani_cras-Manis crassicaudata', 'maca_munz-Macaca munzala', 'maca_radi-Macaca radiata', 'athe_macr', 'vulp_beng', 'lept_java-Leptoptilos javanicus',
  'trac_pile-Trachypithecus pileatus', 'hyst_brac-Hystrix brachyura', 'nilg_hylo-Nilgiritragus hylocrius', 'prio_vive-Prionailurus viverrinus',
  'neof_nebu-Neofelis nebulosa', 'melu_ursi', 'vehi_vehi', 'hyae_hyae-Hyaena hyaena', 'maca_mula-Macaca mulatta', 'fran_pond-Francolinus pondicerianus',
  'munt_munt-Muntiacus muntjak', 'feli_sylv-Felis sylvestris', 'maca_sile-Macaca silenus', 'vive_zibe-Viverra zibetha', 'rusa_unic-Rusa unicolor',
  'lepu_nigr-Lepus nigricollis', 'vive_indi-Viverricula indica', 'pavo_cris', 'anti_cerv', 'gall_lunu-Galloperdix lunulata', 'cato_temm-Catopuma temminckii',
  'sus__scro-Sus scrofa', 'cani_aure-Canis aureus', 'para_herm-Paradoxurus hermaphroditus', 'axis_axis', 'catt_kill', 'goat_sheep', 'vara_beng-Varanus bengalensis',
  'para-jerd-Paradoxurus jerdoni', 'mart_gwat-Martes gwatkinsii', 'homo_sapi', 'semn_john+Semnopithecus johnii', 'herp_edwa-Herpestes edwardsii', 'bos__fron',
  'herp_vitt-Herpestes vitticollis', 'arct_coll', 'dome_cats-Domestic cat', 'bos__indi', 'mell_cape-Mellivora capensis', 'ursu_thib-Ursus thibetanus',
  'semn_ente-Semnopithecus entellus', 'prio_rubi-Prionailurus rubiginosus', 'dome_dogs-Domestic dog', 'cani_lupu-Canis lupus', 'gall_sonn-Gallus sonneratii',
  'gaze_benn-Gazella bennettii', 'bose_trag-Boselaphus tragocamelus', 'budo_taxi-Budorcas taxicolor', 'bos__gaur', 'catt_catt-Cattle', 'blan_blan',
  'cuon_alpi-Cuon alpinus', 'capr_thar-Capricornis thar', 'equu_caba-Equus caballus', 'herp_fusc-Herpestes fuscus', 'trac_john-Trachypithecus johnii',
  'vara_salv-Varanus salvator', 'gall_gall-Gallus gallus', 'naem_gora-Naemorhedus goral', 'herp_urva-Herpestes urva', 'hyst_indi-Hystrix indica',
  'herp_smit-Herpestes smithii', 'bird_bird', 'tetr_quad-Tetracerus quadricornis', 'feli_chau-Felis chaus', 'maca_arct-Macaca arctoides',
  'lutr_pers-Lutrogale perspicillata', 'mosc_indi-Moschiola indica', 'pant_tigr', 'pant_pard-Panthera pardus', 'mart_flav-Martes flavigula',
  'pagu_larv-Paguma larvata-Masked Palm Civet', 'prio_beng-Prionailurus bengalensis', 'gall_spad-Galloperdix spadicea', 'elep_maxi-Elephas maximus',
  'axis_porc', 'anat_elli', 'bats_bats', 'call_pyge-Callosciurus pygerythrus', 'came_came-Camel', 'capr_hisp-Caprolagus hispidus', 'funa_palm-Funambulus palmarum',
  'hela_mala-Helarctos malayanus', 'lutr_lutr-Lutra lutra', 'maca_assa-Macaca assamensis', 'maca_leon-Macaca leonina', 'maca_maca-Macaque', 
  'melo_pers', 'pard_marm-Pardofelis marmorata', 'prio_pard-Prionodon pardicolor', 'tree_shre', 'vulp_vulp'
];

const ClassFilter = ({ onClassSelect, selectedClass, setImages, setClassList }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classListLocal, setClassListLocal] = useState(CLASS_OPTIONS);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setClassList(classListLocal);
  }, [classListLocal, setClassList]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClassSelect = async (className) => {
    onClassSelect(className);
    setDropdownOpen(false);
    setSearchQuery('');

    try {
      const images = await fetchImages(className);
      setImages(images);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const filteredClasses = classListLocal.filter(className =>
    className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="navigation-container">
      <div className="filter-container" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!isDropdownOpen)}
          className="filter-button"
        >
          <span>{selectedClass || 'All'}</span>
          <span className={`arrow ${isDropdownOpen ? 'up' : 'down'}`}>▼</span>
        </button>

        {isDropdownOpen && (
          <div className="dropdown-menu">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="class-list">
              {filteredClasses.map((className) => (
                <button
                  key={className}
                  onClick={() => handleClassSelect(className)}
                  className={`class-option ${selectedClass === className ? 'selected' : ''}`}
                >
                  {className}
                </button>
              ))}
              {filteredClasses.length === 0 && (
                <div className="no-results">No matching classes found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassFilter;