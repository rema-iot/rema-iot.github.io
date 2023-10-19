class nszd_linhar_fit {
    // fit data with model: A sin(2pi t/1yr - alpha) + B t + A sin (alpha)
    constuctor() {
        this.count = 0; // number of measurements
        this.Sm = [];   // filtered signal (witout nans)
        this.Fm = [];   // filtered signal without the harmonic part
        this.Tm = [];   // filtered timestamps
        this.Dm = [];   // filtered dates
        this.Em = [];   // renormalized energy release or depleted mass
        this.Me = [];   // model energy release
        this.Th = [];   // measurement phases (rad)
        this.A = 0;     // a = A*1yr/2pi
        this.B = 0;     // b = B*(1yr/2pi)^2
        this.err_fit = 0; // fitting error
        this.alpha = 0; // model phase
    }
    setup(Sm, timestamps, dates) {
        console.log("nszd_linhar_fit: loading data");
        this.Sm = new Array();
        this.Em = new Array();
        this.Th = new Array();
        this.Tm = new Array();
        this.Dm = new Array();
        // find first valid index
        var idx0 = 0;
        while (isNaN(timestamps[idx0])){idx0++;}

        var yr = 365 * 24 * 3600;

        var idx = 0;
        for (var i = idx0; i < Sm.length; i++) {
            if (isNaN(Sm[i]) || isNaN(timestamps[i])){
                console.log("bad data at i: ", i);
            } else {
                this.Dm[idx] = dates[i];
                this.Tm[idx] = timestamps[i];
                this.Sm[idx] = Sm[i];
                this.Em[idx] = Sm[i] * Math.sqrt(yr/(2*Math.PI));
                this.Th[idx] = 2 * Math.PI * (timestamps[i] - timestamps[idx0]) / yr;
                idx++;
            }
        }
        this.count = this.Th.length;
        console.log("nszd_linhar_fit: loaded data");
    }
    calc_integrals(ig, aph) { // ig = {I1:0, I2:0, I3:0, I4:0, I5:0, I6:0}
        var th = this.Th[this.count - 1];
        ig.I1 = 0.5 * (th - 0.5 * Math.sin(2 * (th - aph)) - 0.5 * Math.sin(2 * aph))
                + th * Math.sin(aph)*Math.sin(aph) - 2 * Math.sin(aph)*(Math.cos(th-aph)-Math.cos(aph));
        ig.I2 = -th * Math.cos(th - aph) + Math.sin(th - aph) + Math.sin(aph) + th*Math.sin(aph);
        ig.I3 = th * th * th / 3.0;
        ig.I4 = 0;
        ig.I5 = 0;
        ig.I6 = 0;
        for (var i = 0; i < this.count - 1; i++) {
            ig.I4 += 0.5 * (this.Em[i + 1] * (Math.sin(this.Th[i + 1] - aph) + Math.sin(aph)) +
                this.Em[i] * (Math.sin(this.Th[i] - aph) + Math.sin(aph))) *
                (this.Th[i + 1] - this.Th[i]);

            ig.I5 += 0.5 * (this.Em[i + 1] * this.Th[i + 1] +
                this.Em[i] * this.Th[i]) *
                (this.Th[i + 1] - this.Th[i]);

            ig.I6 += 0.5 * (this.Em[i + 1] * this.Em[i + 1] +
                this.Em[i] * this.Em[i]) *
                (this.Th[i + 1] - this.Th[i]);
        }
        if (isNaN(ig.I1)) console.log("bad I1");
        if (isNaN(ig.I2)) console.log("bad I2");
        if (isNaN(ig.I3)) console.log("bad I3");
        if (isNaN(ig.I4)) console.log("bad I4");
        if (isNaN(ig.I5)) console.log("bad I5");
        if (isNaN(ig.I6)) console.log("bad I6");
    }
    calc_coefs(coef, ig, aph) { // coef = {a:0, b:0}
        this.calc_integrals(ig, aph);
        coef.a = (ig.I2 * ig.I5 - ig.I3 * ig.I4) / (ig.I2 * ig.I2 - ig.I1 * ig.I3);
        coef.b = (ig.I2 * ig.I4 - ig.I1 * ig.I5) / (ig.I2 * ig.I2 - ig.I1 * ig.I3);
    }
    calc_err(aph) {
        var coef = { a: 0, b: 0 };
        var ig = { I1: 0, I2: 0, I3: 0, I4: 0, I5: 0, I6: 0 };
        this.calc_coefs(coef, ig, aph);
        return coef.a * coef.a * ig.I1 + 2 * coef.a * coef.b * ig.I2 - 2 * coef.a * ig.I4 +
            coef.b * coef.b * ig.I3 - 2 * coef.b * ig.I5 + ig.I6;
    }
    find_aph0(){ // search for a raw minimum to start the minimization
        var aph_min = 0;
        var err_min = this.calc_err(aph_min);
        var aph_count = 20;
        for (var i=0; i<aph_count; i++){
            var aph = 2*Math.PI*i/aph_count;
            var err = this.calc_err(aph);
            if (err < err_min){
                aph_min = aph;
                err_min = err;
            }
        }
        return aph_min;
    }
    calc_err012(err_info, aph, d_aph) { // err_info = {err:0, d_err:0, dd_err:0}
        var err_l = this.calc_err(aph - d_aph);
        var err_0 = this.calc_err(aph);
        var err_r = this.calc_err(aph + d_aph);
        var d_err_l = (err_0 - err_l) / d_aph;
        var d_err_r = (err_r - err_0) / d_aph;

        err_info.err = err_0;
        err_info.d_err = 0.5 * (d_err_r + d_err_l);
        err_info.dd_err = (d_err_r - d_err_l) / d_aph;
    }
    calc_model_list(){
        var yr = 365*24*3600;
        this.Me = new Array();
        this.Fm = new Array();
        for (var i=0; i<this.count; i++){
            this.Me[i] = this.A*Math.sin(this.Th[i] - this.alpha) +
                         this.A*Math.sin(this.alpha) + this.B*yr*this.Th[i]/(2*Math.PI);
            this.Fm[i] = this.Sm[i] - (this.A*Math.sin(this.Th[i] - this.alpha) +
                         this.A*Math.sin(this.alpha));
        }
    }
    optimize() {
        console.log("optimizing");
        var aph0 = this.find_aph0();
        var d_aph = 0.1; // rad
        var lamb = 1.0;
        var step = 0;
        var bad_step = 0;
        var max_steps = 100;
        var max_bad_steps = 10;
        var err_info = { err: 0, d_err: 0, dd_err: 0 };
        do {
            console.log("step: ", step, ", lamb: ", lamb, "alpha: ", aph0);
            this.calc_err012(err_info, aph0, d_aph);
            console.log(step, err_info);

            var aph1 = aph0 - lamb * err_info.d_err / err_info.dd_err;
            var aph2 = aph0 - 0.5 * lamb * err_info.d_err / err_info.dd_err;

            var err0 = err_info.err;
            var err1 = this.calc_err(aph1);
            var err2 = this.calc_err(aph2);

            if (err1 < err2) {
                lamb *= 2.0;
                if (err1 < err0) {
                    aph0 = aph1;
                    err0 = err1;
                    bad_step = 0;
                    step++;
                } else {
                    bad_step++;
                }
            } else if (err2 < err1) {
                lamb *= 0.5;
                if (err2 < err0) {
                    aph0 = aph2;
                    err0 = err2;
                    bad_step = 0;
                    step++
                } else {
                    bad_step++;
                }
            } else {
                console.log("Undefined behavior\n");
                break;
            }
        } while (step < max_steps && bad_step < max_bad_steps);
        if (step === max_steps){
            console.log("Reached max number of steps ", max_steps);
        }
        if (bad_step === max_bad_steps){
            console.log("Reached max number of bad steps ", max_bad_steps);
        }

        // calculate coeficients for the resulting aph
        var ig = { I1: 0, I2: 0, I3: 0, I4: 0, I5: 0, I6: 0 };
        var coef = { a: 0, b: 0 };
        this.calc_integrals(ig, aph0);
        this.calc_coefs(coef, ig, aph0);

        var yr = 365 * 24 * 3600;
        this.A = coef.a * Math.pow(2 * Math.PI / yr, 0.5);
        this.B = coef.b * Math.pow(2 * Math.PI / yr, 1.5);
        this.alpha = aph0;
        this.err_fit = Math.sqrt(err0);
        this.calc_model_list();
    }
}

export var linhar_fit = new nszd_linhar_fit();