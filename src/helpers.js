var _ = require('lodash');
var $ = require('jquery');


export function getWaves(folder) {
    // return an array of the wav files in the folder passed
    // call like:
    // getWaves('../shared/natural_sounds').done(function(d){d.forEach(e){console.log(e);}});

    var fileExt = ".wav";
    var d = $.Deferred();

    $.ajax({
        //This will retrieve the contents of the folder if the folder is configured as 'browsable'
        url: folder,
        success: function (data) {
            var results = [];
            $(data).find("a:contains(" + fileExt + ")").each(function () {
                results.push(folder + '/' + $(this).text());
            });
            d.resolve(results);
        },
        error: function (xhr, s, e){
            console.log(e);
            d.reject(e);

        }
    });

    return d.promise();
}

export function getTargets() {
    // return an array of the wav files that should be used as targets
    // call like:
    // getTargets().done(function(d){d.forEach(e){console.log(e);}});

    var d = $.Deferred();

    $.ajax({
        //This will retrieve the contents of the folder if the folder is configured as 'browsable'
        url: '../api/memtest-target',
        success: function (data) {
            let result = [];
            for (let i in data){
                result.push(data[i][0]);
            }

            d.resolve(result);
        },
        error: function (xhr, s, e){
            console.log(e);
            d.reject(e);

        }
    });

    return d.promise();
}

export function getSuccessString() {
    // return a string that is unique for successful completion
    // call like:
    // getSuccessString().done(function(d){d.forEach(e){console.log(e);}});

    var d = $.Deferred();

    $.ajax({
        //This will retrieve the contents of the folder if the folder is configured as 'browsable'
        url: '../api/memtest-mt-identifier',
        success: function (data) {
            d.resolve(data);
        },
        error: function (xhr, s, e){
            console.log(e);
            d.reject(e);

        }
    });

    return d.promise();
}


export function getAllWaves(folders) {
    // get an array of locations for sounds the folders array passed
    // call like:
    // getAllWaves(['../shared/natural_sounds']).done(function(d){d.forEach(e){console.log(e);}});

    var requests = $.map(folders, getWaves);
    var d = $.Deferred();

    $.when.apply(undefined, requests).done(function(){
        var results = [];
        var responses = arguments;
        console.log(responses);
        for (var i in responses){
                $.merge(results, responses[i]);
        }
        d.resolve(results);
    });

    return d.promise();
}


export function createLevel(target_files, vig_files, fill_files, target_dist, vig_min_dist, vig_max_dist) {

    var tot_len = target_files.length*2 + 2*vig_files.length + fill_files.length;


    //first pick where targets go
    var t_locations = [];

    var max_tar_ind = tot_len - (target_dist);
    var targ_indices = _.range(0,max_tar_ind); //array of indices to choose from for targets
    var indices = _.range(0,tot_len); //total array of indices to choose from in general

    for (var i = 0; i < target_files.length; i++){
        var t_first = targ_indices[Math.floor(Math.random() * targ_indices.length)];
        var t_end = t_first + target_dist;
        targ_indices.splice(targ_indices.indexOf(t_first), 1);

        indices.splice(indices.indexOf(t_first), 1);
        indices.splice(indices.indexOf(t_end), 1);

        t_locations.push([t_first, t_end]);
    }

    //then pick where vig tests go
    console.log('tlocations');
    console.log(t_locations);
    console.log('other indices left');
    console.log(indices);

    var v_locations = [];

    for (var f in vig_files){

        var got_one = false;
        while (!got_one) {

            var sel_first_ind = Math.floor(Math.random() * indices.length);
            var possible_sel_end = _.range(indices[sel_first_ind]+vig_min_dist, indices[sel_first_ind]+vig_max_dist+1);

            var possible_sel_end_ind = [];
            for (var i in possible_sel_end){
                var end_ind = indices.indexOf(possible_sel_end[i]);
                if (end_ind != -1){
                    possible_sel_end_ind.push(end_ind);
                }
            }

            if (possible_sel_end_ind.length){
                var sel_end_ind = possible_sel_end_ind[Math.floor(Math.random() * possible_sel_end_ind.length)]
                v_locations.push([indices[sel_first_ind], indices[sel_end_ind]]);
                indices.splice(sel_end_ind, 1);
                indices.splice(sel_first_ind, 1);

                got_one = true;
            }

        }

        var f_locations = indices;

    }


    var file_list = _.range(tot_len);
    for (var l in t_locations) {
        var t_file = target_files.splice(Math.floor(Math.random() * target_files.length), 1)[0];
        file_list[t_locations[l][0]] = t_file;
        file_list[t_locations[l][1]] = t_file;
    }
    for (var l in f_locations) file_list[f_locations[l]] = fill_files.splice(Math.floor(Math.random() * fill_files.length), 1)[0];
    for (var l in v_locations) {
        var v_file = vig_files.splice(Math.floor(Math.random() * vig_files.length), 1)[0];
        file_list[v_locations[l][0]] = v_file;
        file_list[v_locations[l][1]] = v_file;
    }

    return {t_locations, v_locations, f_locations, file_list};

}

export function createRandomLevel(num_vig, num_fill, target_dist=10, vig_min_dist=2, vig_max_dist=4){
  return new Promise((resolve, reject) => {
    getAllWaves(['https://keyword.media.mit.edu/shared/natural_sounds/', 'https://keyword.media.mit.edu/shared/ambiguous_sounds/', 'https://keyword.media.mit.edu/shared/final_morph/']).done(function(data){
        var index = Math.floor( Math.random()*data.length );
        var target_file = data[index];
        data.splice(index, 1);

        var vig_files = [];
        for (var i=0;i<num_vig;i++){
            var index = Math.floor( Math.random()*data.length );
            vig_files.push(data[index]);
            data.splice(index, 1);
        }

        var fill_files = [];
        for (var i=0;i<num_fill;i++){
            var index = Math.floor( Math.random()*data.length );
            fill_files.push(data[index]);
            data.splice(index, 1);
        }

        resolve(createLevel(target_file, vig_files, fill_files, target_dist, vig_min_dist, vig_max_dist));
    });
  });
}

export function createLevelFromFiles(data, num_vig, num_fill, target_dist=10, vig_min_dist=2, vig_max_dist=4){

        var index = Math.floor( Math.random()*data.length );
        var target_file = data[index];
        data.splice(index, 1);

        var vig_files = [];
        for (var i=0;i<num_vig;i++){
            var index = Math.floor( Math.random()*data.length );
            vig_files.push(data[index]);
            data.splice(index, 1);
        }

        var fill_files = [];
        for (var i=0;i<num_fill;i++){
            var index = Math.floor( Math.random()*data.length );
            fill_files.push(data[index]);
            data.splice(index, 1);
        }

        return [data, createLevel(target_file, vig_files, fill_files, target_dist, vig_min_dist, vig_max_dist)];
}

export function createLevelFromTargetAndFiles(targets, data, num_vig, num_fill, target_dist=10, vig_min_dist=2, vig_max_dist=4){

        var vig_files = [];
        for (var i=0;i<num_vig;i++){
            var index = Math.floor( Math.random()*data.length );
            vig_files.push(data[index]);
            data.splice(index, 1);
        }

        var fill_files = [];
        for (var i=0;i<num_fill;i++){
            var index = Math.floor( Math.random()*data.length );
            fill_files.push(data[index]);
            data.splice(index, 1);
        }

        return [data, createLevel(targets, vig_files, fill_files, target_dist, vig_min_dist, vig_max_dist)];
}

export function makeid(len=32) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < len; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

