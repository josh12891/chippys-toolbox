package com.josh12891.tradiestoolbox;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SiteTtsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
