import os
import shutil
from collections import Counter, OrderedDict
from typing import Dict, List

import matplotlib.pyplot as plt
import numpy as np
from iptcinfo3 import IPTCInfo
from sklearn import preprocessing
from sklearn.metrics import (accuracy_score, confusion_matrix,
                             multilabel_confusion_matrix)
from sklearn.metrics import precision_recall_fscore_support as precision_recall

IMG_FORMATS : List[str] = ['bmp', 'dng', 'jpeg', 'jpg', 'mpo', 'png', 'tif', 'tiff', 'webp']

def create_dir(folder_path):
  if not os.path.isdir(folder_path): os.mkdir(folder_path)

def change_tags(image_path, image_name, save_tagged_path, \
    keyword, labels, key_with_conf, ext, bool_value): #image path: str ; keyword: list
    source_name = os.path.normpath(os.path.dirname(image_path) + os.sep + os.pardir)
    log_folder = os.path.join(source_name, 'logs_files')
    if not os.path.isdir(log_folder): os.mkdir(log_folder)

    if len(labels) > 1:
        file1 = open(os.path.join(log_folder, 'multiple_species.txt'), "a")
        L = [os.path.join(image_path, image_name), '\n']
        file1.writelines(L)
        file1.close()

    source = os.path.join(image_path, image_name) + ext
    name = dest_dict[labels[0]]
    image_update_name = image_name
    if not os.path.isdir(os.path.join(save_tagged_path, name)): 
        os.mkdir(os.path.join(save_tagged_path, name))
    c = 1
    if os.path.exists(os.path.join(save_tagged_path, name, image_update_name) + ext):
        in_while = True
        while os.path.exists(os.path.join(save_tagged_path, name, image_update_name) + ext):
            file1 = open(os.path.join(log_folder, 'repeated_names.txt'), "a")
            L = [os.path.join(image_path, image_update_name), " ", name, '\n']
            file1.writelines(L)
            file1.close()
            image_update_name = image_name + f'_{c}'
            c = c + 1
        in_while = False
    shutil.move(source, os.path.join(save_tagged_path, name, image_update_name) + ext)
    f1 = open(os.path.join(log_folder, 'processed_files.txt'), "a")
    L = [os.path.join(image_path, image_name), '\n']
    f1.writelines(L)
    f1.close()
    source = os.path.join(save_tagged_path, name, image_update_name) + ext
    info = IPTCInfo(source)
    info['keywords'] = keyword
    info['caption/abstract'] = ' '.join(map(str, key_with_conf))

    for i in range(len(labels)):
        name = dest_dict[labels[i]]
        c = 1
        in_while = False
        if not os.path.isdir(os.path.join(save_tagged_path, name)):
            os.mkdir(os.path.join(save_tagged_path, name))

        if os.path.exists(os.path.join(save_tagged_path, name, image_update_name) + ext) \
            and i != 0:
            in_while = True
            while os.path.exists(os.path.join(save_tagged_path, name, image_update_name) + ext):
                file1 = open(os.path.join(log_folder, 'repeated_names.txt'), "a")
                L = [os.path.join(image_path, image_update_name), " ", name, '\n']
                file1.writelines(L)
                file1.close()
                image_update_name = image_name + f'_{c}'
                c = c + 1
            info.save_as(os.path.join(save_tagged_path, name, image_update_name) \
                + ext, options='overwrite')
        else:
            if i == 0: info.save()
            else: info.save_as(os.path.join(save_tagged_path, name, image_update_name) \
                + ext, options='overwrite')


def unique_labels(list_pred):
    d = {}
    for item in reversed(list_pred):
        class_num = item.split(' ')[0]
        conf = item.split(' ')[-1].split('\n')[0]
        if (int(class_num) not in d) and (float(conf) > 0.3): #conf threshold 
            d.update({int(class_num): conf})
    return d

# Hardcoded parameters
images_path = './image_directory/merged_folder'  # Set your image path here
pred_path = 'runs/detect/yolo_test_24_08_site0001/labels'  # Set your prediction path here
tagged_path = './image_directory/tagged_images'  # Set your tagged image path here
new_dataset = 'No'  # Indicate if this is a new dataset or tagging already done once

create_dir(tagged_path)

classes = ['mani_cras-Manis crassicaudata', 'maca_munz-Macaca munzala', 'maca_radi-Macaca radiata', 'athe_macr', 'vulp_beng', 'lept_java-Leptoptilos javanicus',
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
                'melo_pers', 'pard_marm-Pardofelis marmorata', 'prio_pard-Prionodon pardicolor', 'tree_shre', 'vulp_vulp']

destination_class_names = ['mani_cras', 'maca_munz', 'maca_radi', 'athe_macr', 'vulp_beng', 'lept_java','trac_pile', 'hyst_brac', 'nilg_hylo', 'prio_vive',
  'neof_nebu', 'melu_ursi', 'vehi_vehi', 'hyae_hyae', 'maca_mula', 'fran_pond', 'munt_munt', 'feli_sylv', 'maca_sile', 'vive_zibe', 'rusa_unic', 'lepu_nigr',
   'vive_indi', 'pavo_cris', 'anti_cerv', 'gall_lunu', 'cato_temm', 'sus__scro', 'cani_aure', 'para_herm', 'axis_axis', 'catt_kill', 'goat_sheep',
    'vara_beng', 'para-jerd', 'mart_gwat', 'homo_sapi', 'semn_john', 'herp_edwa', 'bos__fron', 'herp_vitt', 'arct_coll', 'dome_cats', 'catt_catt', 
    'mell_cape', 'ursu_thib', 'semn_ente', 'prio_rubi', 'dome_dogs', 'cani_lupu', 'gall_sonn', 'gaze_benn', 'bose_trag', 'budo_taxi', 'bos__gaur', 
    'catt_catt', 'blan_blan','cuon_alpi', 'capr_thar', 'equu_caba', 'herp_fusc', 'trac_john','vara_salv', 'gall_gall', 'naem_gora',
     'herp_urva', 'hyst_indi', 'herp_smit', 'bird_bird', 'tetr_quad', 'feli_chau', 'maca_arct', 'lutr_pers', 'mosc_indi', 'pant_tigr', 'pant_pard',
     'mart_flav', 'pagu_larv', 'prio_beng', 'gall_spad', 'elep_maxi', 'axis_porc', 'anat_elli', 'bats_bats', 'call_pyge', 'came_came', 'capr_hisp',
      'funa_palm', 'hela_mala', 'lutr_lutr', 'maca_assa', 'maca_leon', 'maca_maca', 'melo_pers', 'pard_marm', 'prio_pard', 'tree_shre', 'vulp_vulp']

dest_dict = {classes[i]: destination_class_names[i] for i in range(len(classes))}

mapping = {'anat_elli': 'elli', 'anti_cerv': 'cerv', 'arct_coll': 'coll', 'athe_macr': 'macr', 'axis_axis': 'axis', 'axis_porc': 'porc', 'bats_bats': 'bat',
           'bird_bird': 'bird', 'blan_blan': 'blan', 'bos__fron': 'fron', 'bos__gaur': 'gaur', 'bos__indi': 'catt', 'bose_trag-Boselaphus tragocamelus': 'trag',
           'budo_taxi-Budorcas taxicolor': 'taxi', 'call_pyge-Callosciurus pygerythrus': 'pyge', 'came_came-Camel': 'came', 'cani_aure-Canis aureus': 'aure',
           'cani_lupu-Canis lupus': 'lupu', 'capr_hisp-Caprolagus hispidus': 'hisp', 'capr_thar-Capricornis thar': 'thar', 'cato_temm-Catopuma temminckii': 'temm',
           'catt_catt-Cattle': 'catt', 'catt_kill': 'cattkill', 'cuon_alpi-Cuon alpinus': 'alpi', 'dome_cats-Domestic cat': 'cats', 'dome_dogs-Domestic dog': 'dogs',
           'elep_maxi-Elephas maximus': 'elep', 'equu_caba-Equus caballus': 'caba', 'feli_chau-Felis chaus': 'chau', 'feli_sylv-Felis sylvestris': 'sylv',
           'fran_pond-Francolinus pondicerianus': 'fran', 'funa_palm-Funambulus palmarum': 'palm', 'gall_gall-Gallus gallus': 'gall', 'gall_lunu-Galloperdix lunulata': 'lunu',
           'gall_sonn-Gallus sonneratii': 'sonn', 'gall_spad-Galloperdix spadicea': 'spad', 'gaze_benn-Gazella bennettii': 'benn', 'goat_sheep': 'goat', 'hela_mala-Helarctos malayanus': 'mala',
           'herp_edwa-Herpestes edwardsii': 'edwa', 'herp_fusc-Herpestes fuscus': 'fusc', 'herp_smit-Herpestes smithii': 'smit', 'herp_urva-Herpestes urva': 'urva',
           'herp_vitt-Herpestes vitticollis': 'vitt', 'homo_sapi': 'sapi', 'hyae_hyae-Hyaena hyaena': 'hyae', 'hyst_brac-Hystrix brachyura': 'brac', 'hyst_indi-Hystrix indica': 'hystindi',
           'lept_java-Leptoptilos javanicus': 'java', 'lepu_nigr-Lepus nigricollis': 'nigr', 'lutr_lutr-Lutra lutra': 'lutr', 'lutr_pers-Lutrogale perspicillata': 'lutrpers',
           'maca_arct-Macaca arctoides': 'arct', 'maca_assa-Macaca assamensis': 'assa', 'maca_leon-Macaca leonina': 'leon', 'maca_maca-Macaque': 'maca_maca',
           'maca_mula-Macaca mulatta': 'mula', 'maca_munz-Macaca munzala': 'munz', 'maca_radi-Macaca radiata': 'radi', 'maca_sile-Macaca silenus': 'sile',
           'mani_cras-Manis crassicaudata': 'cras', 'mart_flav-Martes flavigula': 'flav', 'mart_gwat-Martes gwatkinsii': 'gwat', 'mell_cape-Mellivora capensis': 'cape',
           'melo_pers': 'melopers', 'melu_ursi': 'ursi', 'mosc_indi-Moschiola indica': 'moscindi', 'munt_munt-Muntiacus muntjak': 'munt', 'naem_gora-Naemorhedus goral': 'gora',
           'neof_nebu-Neofelis nebulosa': 'nebu', 'nilg_hylo-Nilgiritragus hylocrius': 'hylo', 'pagu_larv-Paguma larvata-Masked Palm Civet': 'larv', 'pant_pard-Panthera pardus': 'pard',
           'pant_tigr': 'tigr', 'para-jerd-Paradoxurus jerdoni': 'jerd', 'para_herm-Paradoxurus hermaphroditus': 'herm', 'pard_marm-Pardofelis marmorata': 'marm',
           'pavo_cris': 'pavo', 'prio_beng-Prionailurus bengalensis': 'beng', 'prio_pard-Prionodon pardicolor': 'pard', 'prio_rubi-Prionailurus rubiginosus': 'rubi',
           'prio_vive-Prionailurus viverrinus': 'vive', 'rusa_unic-Rusa unicolor': 'unic', 'semn_ente-Semnopithecus entellus': 'ente', 'semn_john+Semnopithecus johnii': 'john',
           'sus__scro-Sus scrofa': 'scro', 'tetr_quad-Tetracerus quadricornis': 'quad', 'trac_john-Trachypithecus johnii': 'trac_john', 'trac_pile-Trachypithecus pileatus': 'pile',
           'tree_shre': 'tree', 'ursu_thib-Ursus thibetanus': 'thib', 'vara_beng-Varanus bengalensis': 'varabeng', 'vara_salv-Varanus salvator': 'salv', 'vehi_vehi': 'vehi',
           'vive_indi-Viverricula indica': 'viveindi', 'vive_zibe-Viverra zibetha': 'zibe', 'vulp_beng': 'vulpbeng', 'vulp_vulp': 'vulp'}

le = preprocessing.LabelEncoder()
le.fit(classes)
word_to_int = le.transform(classes)
res = dict(zip(classes, word_to_int))

res['unid_unid'] = len(classes)

res_int_to_word = {}
keys = list(res.keys())
values = list(res.values())

for i in range(len(keys)):
    res_int_to_word[values[i]] = keys[i]

sorted_res_int_to_word = OrderedDict(sorted(res_int_to_word.items()))

all_images = os.listdir(images_path)
all_pred_labels = os.listdir(pred_path)

print("Total images were {}, YOLO detected labels for {} images".format(len(all_images), len(all_pred_labels)))

image_name_dict = {}
image_names = []
other_extension_files = 0
for file_name in all_images:
    if file_name.split('.')[-1].lower() in IMG_FORMATS:
        image_name = file_name.split('.')[0]
        image_name_dict[image_name] = [file_name, '.' + file_name.split('.')[1]]  # save original file name and extension also
        image_names.append(image_name)
    else:
        other_extension_files += 1

print("Other Extension Files: ", other_extension_files)

image_preds = {}
cnt = 0 
flag = False
prefix = ['a', 'b', 'c']





for image in image_names:
    ext = image_name_dict[image][1]
    
    
    name = str(os.path.join(images_path, image) + '\n')
    
    labels = []
    try:
        text_file = image + '.txt'
        file = open(os.path.join(pred_path, text_file), 'r')
        all_preds = file.readlines()
        pred_dict = unique_labels(all_preds)
        keyword = []
        key_with_conf = []
        if len(all_preds) == 0:  # for empty label.txt file, put the image in blank folder
            keyword = ['blan']
            labels.append('blan_blan')
            key_with_conf = ['blan_conf_unknown']
        elif len(pred_dict) == 0:  # if predictions less than confidence score put them in unidentified
            keyword.append('blan')
            labels.append('blan_blan')
            key_with_conf.append('blan_conf_unknown')
        elif len(pred_dict.keys()) <= 3:
            index = 0
            for label, conf in pred_dict.items():
                labels.append(f'{sorted_res_int_to_word[label]}')
                keyword.append(f'{prefix[index]}_{mapping[sorted_res_int_to_word[label]]}')
                key_with_conf.append(f'{prefix[index]}_{mapping[sorted_res_int_to_word[label]]}_{conf}')
                index += 1
        elif len(pred_dict.keys()) > 3:
            count = 1
            index = 0
            for label, conf in pred_dict.items():
                labels.append(f'{sorted_res_int_to_word[label]}')
                keyword.append(f'{prefix[index]}_{mapping[sorted_res_int_to_word[label]]}')
                key_with_conf.append(f'{prefix[index]}_{mapping[sorted_res_int_to_word[label]]}_{conf}')
                index += 1
                count += 1
                if count > 3:
                    break
        else:
            print('#####################################')
            print('No condition met')
            print('#####################################')
        if len(keyword) == 0:
            keyword.append('blan')
            labels.append('blan_blan')
            key_with_conf.append('blan_conf_unknown')
        change_tags(images_path, image, tagged_path, keyword, labels, key_with_conf, ext, new_dataset)
    except:
        print('Generated label not found for this image {}'.format(image))
        cnt = cnt + 1
        keyword = ['blan']
        labels.append('blan_blan')
        key_with_conf = ['blan_conf_unknown']
        change_tags(images_path, image, tagged_path, keyword, labels, key_with_conf, ext, new_dataset)
 


